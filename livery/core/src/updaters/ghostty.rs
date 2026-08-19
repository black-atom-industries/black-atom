use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let Some(config_path) = app_config.config_path.as_deref() else {
        return UpdateResult::error(app_str, "Missing config_path");
    };
    let (pattern, template) = match (&app_config.match_pattern, &app_config.replace_template) {
        (Some(p), Some(t)) => (p, t),
        _ => return UpdateResult::error(app_str, "Missing match_pattern or replace_template"),
    };

    if let Err(e) = file_ops::text::patch_text_file(
        config_path.to_string(),
        pattern.clone(),
        template.clone(),
        ctx.build_variables(),
    ) {
        return UpdateResult::error(app_str, e);
    }

    match reload() {
        Ok(signaled) => {
            log::info!(
                "Updated ghostty config: {} ({} instance(s) signaled)",
                config_path,
                signaled
            );
            UpdateResult::done(app_str)
        }
        Err(msg) => {
            log::warn!("{msg}");
            UpdateResult::skipped(
                app_str,
                format!("Config patched; live reload failed: {msg}"),
            )
        }
    }
}

/// Send SIGUSR2 to every running ghostty instance to reload its config.
/// Returns how many instances were signaled (0 = not running, which is fine
/// — the patched config applies on next launch).
///
/// Deliberately NOT `pkill ghostty`: pkill/pgrep match the kernel's `comm`,
/// which macOS sets to the (truncated) launch path for Finder-launched apps
/// (`/Applications/Gh…`), so name matching silently misses them. `ps`'s
/// `ucomm` column reports the real executable name regardless of how the
/// app was launched.
fn reload() -> Result<usize, String> {
    let output = std::process::Command::new("ps")
        .args(["-axo", "pid=,ucomm="])
        .output()
        .map_err(|e| format!("Failed to list processes: {e}"))?;

    if !output.status.success() {
        return Err("ps exited non-zero while listing processes".to_string());
    }

    let pids: Vec<String> = String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| {
            let mut parts = line.split_whitespace();
            let pid = parts.next()?;
            let ucomm = parts.next()?;
            (ucomm == "ghostty").then(|| pid.to_string())
        })
        .collect();

    if pids.is_empty() {
        log::info!("ghostty not running — config applies on next launch");
        return Ok(0);
    }

    let mut signaled = 0;
    for pid in &pids {
        match std::process::Command::new("kill")
            .args(["-USR2", pid])
            .output()
        {
            Ok(out) if out.status.success() => signaled += 1,
            Ok(out) => {
                log::warn!(
                    "kill -USR2 {pid} failed: {}",
                    String::from_utf8_lossy(&out.stderr).trim()
                );
            }
            Err(e) => log::warn!("Failed to run kill for pid {pid}: {e}"),
        }
    }

    if signaled == 0 {
        return Err(format!(
            "found {} ghostty instance(s) but signaled none",
            pids.len()
        ));
    }

    Ok(signaled)
}
