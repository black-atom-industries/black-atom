use std::path::{Path, PathBuf};

use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

/// Update nvim config and reload running instances.
/// `max_sockets` limits how many instances to send to (None = all, Some(1) = benchmark mode).
pub fn update(
    app_str: &str,
    app_config: &AppConfig,
    ctx: &UpdateContext,
    max_sockets: Option<usize>,
) -> UpdateResult {
    let (pattern, template) = match (&app_config.match_pattern, &app_config.replace_template) {
        (Some(p), Some(t)) => (p, t),
        _ => return UpdateResult::error(app_str, "Missing match_pattern or replace_template"),
    };

    if let Err(e) = file_ops::text::patch_text_file(
        app_config.config_path.clone(),
        pattern.clone(),
        template.clone(),
        ctx.build_variables(),
    ) {
        return UpdateResult::error(app_str, e);
    }

    match reload(ctx.theme_key, max_sockets) {
        Err(msg) => {
            log::warn!("{msg}");
            UpdateResult::skipped(
                app_str,
                format!("Config patched; live reload failed: {msg}"),
            )
        }
        Ok(summary) if !summary.failures.is_empty() => {
            let msg = reload_failure_message(&summary);
            log::warn!("{msg}");
            UpdateResult::skipped(app_str, format!("Config patched; {msg}"))
        }
        Ok(_) => UpdateResult::done(app_str),
    }
}

/// Per-socket reload outcome. `stale` sockets (dead leftovers, connection
/// refused) stay quiet; `failures` are live instances that answered but
/// could not apply the colorscheme — those must surface as degraded.
struct ReloadSummary {
    sent: u32,
    stale: u32,
    /// (socket file name, first stderr line) per live-but-failed send.
    failures: Vec<(String, String)>,
}

enum SendOutcome {
    Sent,
    Stale,
    Failed(String),
}

/// Classify one `nvim --server … --remote-expr` result. E247 means the
/// socket is a dead leftover (quiet); any other non-zero exit is a live
/// instance that refused the colorscheme — report it, never swallow it.
fn classify_send(output: &std::process::Output) -> SendOutcome {
    if output.status.success() {
        return SendOutcome::Sent;
    }
    let stderr = String::from_utf8_lossy(&output.stderr);
    if stderr.contains("E247") || stderr.contains("Failed to connect") {
        return SendOutcome::Stale;
    }
    let reason = stderr
        .lines()
        .find(|line| !line.trim().is_empty())
        .unwrap_or("unknown error")
        .trim()
        .to_string();
    SendOutcome::Failed(reason)
}

/// One-line degraded message: counts + the first per-socket reason.
fn reload_failure_message(summary: &ReloadSummary) -> String {
    let live = summary.sent + summary.failures.len() as u32;
    let (socket, reason) = &summary.failures[0];
    let more = match summary.failures.len() {
        0 | 1 => String::new(),
        n => format!(" (+{} more)", n - 1),
    };
    format!(
        "reload failed on {}/{live} live nvim instances — {socket}: {reason}{more}",
        summary.failures.len(),
    )
}

/// Validate that a theme key only contains safe characters (alphanumeric, hyphens, underscores).
fn is_valid_theme_key(key: &str) -> bool {
    !key.is_empty()
        && key
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Check whether a file name matches Neovim's server socket naming convention:
/// `<appname>.<pid>.<instance>`, e.g. `nvim.12345.0` or `nvim-edit.12345.0`.
/// The appname segment varies with `$NVIM_APPNAME`, so only the trailing
/// `.<pid>.<instance>` (both numeric) is checked.
fn is_nvim_socket_name(name: &str) -> bool {
    let mut parts = name.rsplitn(3, '.');
    let (Some(instance), Some(pid), Some(appname)) = (parts.next(), parts.next(), parts.next())
    else {
        return false;
    };
    !appname.is_empty()
        && !pid.is_empty()
        && !instance.is_empty()
        && pid.chars().all(|c| c.is_ascii_digit())
        && instance.chars().all(|c| c.is_ascii_digit())
}

/// Find all Neovim server sockets in the given tmpdir.
/// Neovim auto-creates sockets at $TMPDIR/nvim.<user>/*/<appname>.<pid>.<instance>
// TODO: Also check $XDG_RUNTIME_DIR on Linux for nvim sockets
fn find_nvim_sockets(tmpdir: &Path) -> Vec<PathBuf> {
    let mut sockets = Vec::new();

    let Ok(entries) = std::fs::read_dir(tmpdir) else {
        return sockets;
    };

    for entry in entries.flatten() {
        let dir_name = entry.file_name();
        if !dir_name.to_string_lossy().starts_with("nvim.") {
            continue;
        }

        let nvim_dir = entry.path();
        let Ok(sub_entries) = std::fs::read_dir(&nvim_dir) else {
            continue;
        };

        for sub_entry in sub_entries.flatten() {
            let Ok(sub_files) = std::fs::read_dir(sub_entry.path()) else {
                continue;
            };

            for socket_entry in sub_files.flatten() {
                let socket_path = socket_entry.path();
                let socket_name = socket_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if is_nvim_socket_name(&socket_name) {
                    sockets.push(socket_path);
                }
            }
        }
    }

    sockets
}

/// Reload all running Neovim instances via `--remote-expr execute("colorscheme …")`.
/// remote-expr (unlike remote-send) never types into an insert-mode buffer,
/// leaves the user's mode untouched, and reports whether the colorscheme
/// actually applied — E185 from a live instance comes back as a failure.
/// Returns Err only when reload could not be attempted (invalid theme key).
/// No sockets found is not an error — nvim picks the theme up on next launch.
fn reload(theme_key: &str, max_sockets: Option<usize>) -> Result<ReloadSummary, String> {
    if !is_valid_theme_key(theme_key) {
        return Err(format!("Invalid theme key for nvim reload: {theme_key}"));
    }

    let tmpdir = std::env::var("TMPDIR").unwrap_or_else(|_| "/tmp".to_string());
    let mut sockets = find_nvim_sockets(Path::new(&tmpdir));
    if let Some(limit) = max_sockets {
        sockets.truncate(limit);
    }

    if sockets.is_empty() {
        log::info!("No nvim sockets found — will apply on next launch");
        return Ok(ReloadSummary {
            sent: 0,
            stale: 0,
            failures: Vec::new(),
        });
    }

    // theme_key is validated above — safe inside the quoted expr.
    let expr = format!(r#"execute("colorscheme {theme_key}")"#);
    let total = sockets.len();

    // Send to all sockets in parallel — each is an independent subprocess
    let outcomes: Vec<(String, SendOutcome)> = std::thread::scope(|s| {
        let handles: Vec<_> = sockets
            .iter()
            .map(|socket_path| {
                let expr = &expr;
                s.spawn(move || {
                    let socket_name = socket_path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_else(|| socket_path.display().to_string());

                    let result = std::process::Command::new("nvim")
                        .args([
                            "--server",
                            &socket_path.to_string_lossy(),
                            "--remote-expr",
                            expr,
                        ])
                        .output();

                    let outcome = match result {
                        Ok(output) => classify_send(&output),
                        Err(e) => SendOutcome::Failed(format!("could not spawn nvim: {e}")),
                    };
                    (socket_name, outcome)
                })
            })
            .collect();

        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });

    let mut summary = ReloadSummary {
        sent: 0,
        stale: 0,
        failures: Vec::new(),
    };
    for (socket_name, outcome) in outcomes {
        match outcome {
            SendOutcome::Sent => summary.sent += 1,
            SendOutcome::Stale => summary.stale += 1,
            SendOutcome::Failed(reason) => summary.failures.push((socket_name, reason)),
        }
    }

    log::info!(
        "Applied colorscheme {} on {}/{} nvim sockets ({} stale, {} failed)",
        theme_key,
        summary.sent,
        total,
        summary.stale,
        summary.failures.len(),
    );

    Ok(summary)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_nvim_socket_name() {
        assert!(is_nvim_socket_name("nvim.12345.0"));
        assert!(is_nvim_socket_name("nvim-edit.12345.0"));
        assert!(is_nvim_socket_name("lazyvim.1.0"));
    }

    #[test]
    fn test_is_nvim_socket_name_rejects_non_sockets() {
        assert!(!is_nvim_socket_name("nvim"));
        assert!(!is_nvim_socket_name("nvim.lock"));
        assert!(!is_nvim_socket_name("nvim..0"));
        assert!(!is_nvim_socket_name(".12345.0"));
        assert!(!is_nvim_socket_name("nvim.12345.abc"));
    }

    fn fake_output(code: i32, stderr: &str) -> std::process::Output {
        use std::os::unix::process::ExitStatusExt;
        std::process::Output {
            status: std::process::ExitStatus::from_raw(code << 8),
            stdout: Vec::new(),
            stderr: stderr.as_bytes().to_vec(),
        }
    }

    #[test]
    fn test_classify_send_success() {
        assert!(matches!(
            classify_send(&fake_output(0, "")),
            SendOutcome::Sent
        ));
    }

    #[test]
    fn test_classify_send_dead_socket_is_stale() {
        let stderr =
            "E247: Failed to connect to '/tmp/nvim.sock': connection refused. Send expression failed.";
        assert!(matches!(
            classify_send(&fake_output(2, stderr)),
            SendOutcome::Stale
        ));
    }

    #[test]
    fn test_classify_send_live_failure_carries_reason() {
        let stderr =
            "Lua: Vim(colorscheme):E185: Cannot find color scheme 'nope'\nstack traceback:";
        match classify_send(&fake_output(2, stderr)) {
            SendOutcome::Failed(reason) => {
                assert!(reason.contains("E185"), "reason was: {reason}");
                assert!(!reason.contains("traceback"));
            }
            _ => panic!("expected Failed"),
        }
    }

    #[test]
    fn test_reload_failure_message_counts_and_first_reason() {
        let summary = ReloadSummary {
            sent: 1,
            stale: 2,
            failures: vec![
                (
                    "nvim-edit.3715.0".to_string(),
                    "E185: Cannot find color scheme".to_string(),
                ),
                ("nvim.99.0".to_string(), "whatever".to_string()),
            ],
        };
        let msg = reload_failure_message(&summary);
        assert_eq!(
            msg,
            "reload failed on 2/3 live nvim instances — nvim-edit.3715.0: E185: Cannot find color scheme (+1 more)"
        );
    }
}
