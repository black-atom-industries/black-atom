use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use crate::config::types::{AppConfig, NvimSettings, NvimStyle};

use super::file_ops;
use super::{UpdateContext, UpdateResult};

pub const SETTINGS_BEGIN_MARKER: &str = "-- BEGIN BLACK ATOM LIVERY CONFIG";
pub const SETTINGS_END_MARKER: &str = "-- END BLACK ATOM LIVERY CONFIG";

/// Flags the plugin's own defaults declare for a group. Those must always
/// be emitted so the page can turn them off; the rest are emitted only when
/// on. `ext_hl` deep-extends the group table over each highlight, so an
/// explicit `bold = false` would strip a hardcoded one — `@function.call`
/// and `@method.call` hardcode `bold = true`.
fn declared_by_plugin(group: &str) -> (bool, bool) {
    match group {
        "comments" => (false, true),
        "keywords" => (true, false),
        "strings" => (false, true),
        "messages" => (true, false),
        _ => (false, false),
    }
}

fn style_line(group: &str, style: &NvimStyle) -> String {
    let (bold_declared, italic_declared) = declared_by_plugin(group);
    let mut flags = Vec::new();
    if style.bold || bold_declared {
        flags.push(format!("bold = {}", style.bold));
    }
    if style.italic || italic_declared {
        flags.push(format!("italic = {}", style.italic));
    }
    if flags.is_empty() {
        return format!("            {group} = {{}},\n");
    }
    format!("            {group} = {{ {} }},\n", flags.join(", "))
}

/// Render the settings as the Lua assignment the plugin reads. Key order is
/// fixed and every group carries both flags: the plugin deep-merges this
/// table over its own defaults, so an omitted key would silently keep the
/// plugin's value instead of the user's.
pub fn render_settings_lua(settings: &NvimSettings) -> String {
    let styles = &settings.styles;
    let syntax = &styles.syntax;
    let mut out = String::new();
    out.push_str(SETTINGS_BEGIN_MARKER);
    out.push_str("\nvim.g.black_atom_core_config = {\n");
    out.push_str(&format!("    term_colors = {},\n", settings.term_colors));
    out.push_str("    styles = {\n");
    out.push_str(&format!(
        "        transparency = {},\n",
        lua_string(&styles.transparency)
    ));
    out.push_str(&format!(
        "        ending_tildes = {},\n",
        styles.ending_tildes
    ));
    out.push_str(&format!(
        "        cmp_kind_color_mode = {},\n",
        lua_string(&styles.cmp_kind_color_mode)
    ));
    out.push_str(&format!(
        "        dark_sidebars = {},\n",
        styles.dark_sidebars
    ));
    out.push_str(&format!("        dark_floats = {},\n", styles.dark_floats));
    out.push_str("        diagnostics = {\n");
    out.push_str(&format!(
        "            undercurl = {},\n",
        styles.diagnostics.undercurl
    ));
    out.push_str(&format!(
        "            background = {},\n",
        styles.diagnostics.background
    ));
    out.push_str("        },\n");
    out.push_str("        syntax = {\n");
    out.push_str(&style_line("comments", &syntax.comments));
    out.push_str(&style_line("keywords", &syntax.keywords));
    out.push_str(&style_line("functions", &syntax.functions));
    out.push_str(&style_line("strings", &syntax.strings));
    out.push_str(&style_line("variables", &syntax.variables));
    out.push_str(&style_line("messages", &syntax.messages));
    out.push_str("        },\n");
    out.push_str("    },\n");
    out.push_str("}\n");
    out.push_str(SETTINGS_END_MARKER);
    out.push('\n');
    out
}

/// Quote a value as a Lua string literal. Only the option enums pass
/// through here, but escaping keeps a hand-edited config from breaking the
/// file it lands in.
fn lua_string(value: &str) -> String {
    let escaped = value.replace('\\', "\\\\").replace('"', "\\\"");
    format!("\"{escaped}\"")
}

/// Write the settings into the managed Lua block in `settings_path`.
///
/// The file must already exist: it is the user's own `init.lua`, and
/// creating one would put a Livery-owned file where Neovim looks for the
/// user's entry point.
pub fn write_settings(settings_path: &str, settings: &NvimSettings) -> UpdateResult {
    let expanded = shellexpand::tilde(settings_path).to_string();
    if !Path::new(&expanded).is_file() {
        return UpdateResult::error(
            "nvim",
            format!("No file at the configured SETTINGS_PATH ({settings_path}) — create it, or point SETTINGS_PATH at your Neovim entry point."),
        );
    }

    let rendered = render_settings_lua(settings);
    let block = file_ops::managed_block::ManagedBlock {
        begin_marker: SETTINGS_BEGIN_MARKER,
        end_marker: SETTINGS_END_MARKER,
        conflicting_table_pattern: None,
        validate_fragment: &|fragment| validate_settings_fragment(fragment, &rendered),
        validate_file: &|_| Ok(()),
    };

    match file_ops::managed_block::patch_managed_block_file(expanded, &rendered, &block) {
        Ok(_) => UpdateResult::done("nvim"),
        Err(e) => UpdateResult::error("nvim", e),
    }
}

/// The fragment is never user input — it is what `render_settings_lua` just
/// produced. Checking that identity is the whole validation the Lua path
/// needs; parsing Lua to prove the same thing would buy nothing.
fn validate_settings_fragment(fragment: &str, rendered: &str) -> Result<(), String> {
    if fragment == rendered {
        Ok(())
    } else {
        Err("Managed Lua block was not produced by the renderer".to_string())
    }
}

/// Update nvim config and reload running instances.
/// `max_sockets` limits how many instances to send to (None = all, Some(1) = benchmark mode).
pub fn update(
    app_str: &str,
    app_config: &AppConfig,
    ctx: &UpdateContext,
    max_sockets: Option<usize>,
) -> UpdateResult {
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

fn run_with_timeout(mut command: Command, timeout: Duration) -> Result<Output, String> {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = command
        .spawn()
        .map_err(|error| format!("could not spawn nvim: {error}"))?;
    let mut stdout = child.stdout.take().expect("nvim stdout was piped");
    let mut stderr = child.stderr.take().expect("nvim stderr was piped");
    let stdout_reader = thread::spawn(move || {
        let mut output = Vec::new();
        stdout.read_to_end(&mut output).map(|_| output)
    });
    let stderr_reader = thread::spawn(move || {
        let mut output = Vec::new();
        stderr.read_to_end(&mut output).map(|_| output)
    });

    let deadline = Instant::now() + timeout;
    let mut timed_out = false;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if Instant::now() >= deadline => {
                timed_out = true;
                child.kill().ok();
                break child
                    .wait()
                    .map_err(|error| format!("could not stop timed-out nvim: {error}"))?;
            }
            Ok(None) => thread::sleep(Duration::from_millis(10)),
            Err(error) => {
                child.kill().ok();
                let _ = child.wait();
                return Err(format!("could not check nvim: {error}"));
            }
        }
    };

    let stdout = stdout_reader
        .join()
        .map_err(|_| "nvim stdout reader panicked".to_string())?
        .map_err(|error| format!("could not read nvim stdout: {error}"))?;
    let stderr = stderr_reader
        .join()
        .map_err(|_| "nvim stderr reader panicked".to_string())?
        .map_err(|error| format!("could not read nvim stderr: {error}"))?;

    if timed_out {
        return Err(format!(
            "nvim reload timed out after {}s",
            timeout.as_secs()
        ));
    }

    Ok(Output {
        status,
        stdout,
        stderr,
    })
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

const RELOAD_TIMEOUT: Duration = Duration::from_secs(5);

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

                    let mut command = Command::new("nvim");
                    command.args([
                        "--server",
                        &socket_path.to_string_lossy(),
                        "--remote-expr",
                        expr,
                    ]);
                    let result = run_with_timeout(command, RELOAD_TIMEOUT);

                    let outcome = match result {
                        Ok(output) => classify_send(&output),
                        Err(e) => SendOutcome::Failed(e),
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
    use crate::config::types::{NvimDiagnostics, NvimSettings, NvimStyle, NvimStyles, NvimSyntax};
    use crate::updaters::UpdateStatus;

    use std::io::Write;

    const PREAMBLE: &str = "-- my config\nvim.opt.number = true\n\n";
    const EPILOGUE: &str = "\nvim.opt.wrap = false\n";

    fn temp_init_lua() -> tempfile::NamedTempFile {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
        file.write_all(format!("{PREAMBLE}{EPILOGUE}").as_bytes())
            .unwrap();
        file
    }

    /// Every field off its default, and every syntax group carrying at
    /// least one `true` — so the rendered table has no empty group and
    /// `vim.json.encode` yields objects rather than empty arrays.
    fn loud_settings() -> NvimSettings {
        let on = NvimStyle {
            bold: true,
            italic: true,
        };
        NvimSettings {
            term_colors: false,
            styles: NvimStyles {
                transparency: "full".to_string(),
                ending_tildes: true,
                cmp_kind_color_mode: "fg".to_string(),
                dark_sidebars: false,
                dark_floats: false,
                diagnostics: NvimDiagnostics {
                    undercurl: true,
                    background: true,
                },
                syntax: NvimSyntax {
                    comments: on,
                    keywords: on,
                    functions: on,
                    strings: on,
                    variables: on,
                    messages: on,
                },
            },
        }
    }

    #[test]
    fn writes_one_block_and_leaves_the_rest_of_the_file_alone() {
        let file = temp_init_lua();
        let path = file.path().to_string_lossy().to_string();
        let settings = NvimSettings::default();

        let result = write_settings(&path, &settings);
        assert_eq!(result.status, UpdateStatus::Done, "{:?}", result.message);

        let written = std::fs::read_to_string(&path).unwrap();
        assert_eq!(written.matches(SETTINGS_BEGIN_MARKER).count(), 1);
        assert_eq!(written.matches(SETTINGS_END_MARKER).count(), 1);
        assert!(
            written.starts_with(&format!("{PREAMBLE}{EPILOGUE}")),
            "existing lines changed: {written}"
        );
        assert!(written.ends_with(&render_settings_lua(&settings)));
    }

    #[test]
    fn rewriting_replaces_the_block_in_place() {
        let file = temp_init_lua();
        let path = file.path().to_string_lossy().to_string();

        write_settings(&path, &NvimSettings::default());
        let after_first = std::fs::read_to_string(&path).unwrap();

        let unchanged = write_settings(&path, &NvimSettings::default());
        assert_eq!(unchanged.status, UpdateStatus::Done);
        assert_eq!(std::fs::read_to_string(&path).unwrap(), after_first);

        write_settings(&path, &loud_settings());
        let after_second = std::fs::read_to_string(&path).unwrap();

        assert_eq!(after_second.matches(SETTINGS_BEGIN_MARKER).count(), 1);
        assert!(after_second.starts_with(&format!("{PREAMBLE}{EPILOGUE}")));
        assert!(after_second.ends_with(&render_settings_lua(&loud_settings())));
        assert!(!after_second.contains("transparency = \"none\""));
    }

    #[test]
    fn reports_a_missing_settings_file_with_its_path() {
        let home = dirs::home_dir().unwrap();
        let dir = tempfile::TempDir::new_in(home).unwrap();
        let missing = dir.path().join("init.lua");
        let path = missing.to_string_lossy().to_string();

        let result = write_settings(&path, &NvimSettings::default());
        assert_eq!(result.status, UpdateStatus::Error);
        let message = result.message.unwrap();
        assert!(message.contains(&path), "{message}");
    }

    /// The block is only worth anything if the plugin resolves it to the
    /// settings the user chose. Skipped when nvim is absent (CI).
    #[test]
    fn neovim_resolves_the_block_to_the_chosen_settings() {
        let Ok(nvim) = which_nvim() else {
            eprintln!("skipped: nvim not on PATH");
            return;
        };

        let file = temp_init_lua();
        let path = file.path().to_string_lossy().to_string();
        let settings = loud_settings();
        let result = write_settings(&path, &settings);
        assert_eq!(result.status, UpdateStatus::Done, "{:?}", result.message);

        let decoded = resolve_through_nvim(&nvim, &path);
        assert_eq!(decoded, serde_json::to_value(&settings).unwrap());
    }

    /// Source the patched file, then hand back what the plugin resolves as
    /// JSON — the same merge a real session performs.
    fn resolve_through_nvim(nvim: &std::path::Path, init_lua: &str) -> serde_json::Value {
        let plugin_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../adapters/nvim")
            .canonicalize()
            .unwrap();
        let output = std::process::Command::new(nvim)
            .args([
                "--headless",
                "-u",
                "NONE",
                "--cmd",
                &format!("set runtimepath+={}", plugin_root.display()),
                "-c",
                &format!("luafile {init_lua}"),
                "-c",
                "lua io.write(vim.json.encode(require('black-atom.config').resolve()))",
                "-c",
                "q",
            ])
            .output()
            .expect("failed to run nvim");
        assert!(
            output.status.success(),
            "nvim exited {:?}: {}",
            output.status.code(),
            String::from_utf8_lossy(&output.stderr)
        );

        let stdout = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str(stdout.trim())
            .unwrap_or_else(|e| panic!("nvim printed {stdout:?}, not JSON: {e}"))
    }

    /// `NvimSettings::default()` claims to mirror the plugin's `M.defaults`.
    /// The plugin deep-merges the block over those defaults, so the honest
    /// check is that writing the default block resolves to them unchanged.
    #[test]
    fn the_default_block_resolves_to_the_plugin_defaults() {
        let Ok(nvim) = which_nvim() else {
            eprintln!("skipped: nvim not on PATH");
            return;
        };

        let file = temp_init_lua();
        let path = file.path().to_string_lossy().to_string();
        let result = write_settings(&path, &NvimSettings::default());
        assert_eq!(result.status, UpdateStatus::Done, "{:?}", result.message);

        let with_block = resolve_through_nvim(&nvim, &path);
        let plugin_defaults = plugin_defaults_through_nvim(&nvim);
        assert_eq!(
            with_block, plugin_defaults,
            "the default block changes what the plugin resolves"
        );
    }

    fn plugin_defaults_through_nvim(nvim: &std::path::Path) -> serde_json::Value {
        let plugin_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../adapters/nvim")
            .canonicalize()
            .unwrap();
        let output = std::process::Command::new(nvim)
            .args([
                "--headless",
                "-u",
                "NONE",
                "--cmd",
                &format!("set runtimepath+={}", plugin_root.display()),
                "-c",
                "lua io.write(vim.json.encode(require('black-atom.config').defaults))",
                "-c",
                "q",
            ])
            .output()
            .expect("failed to run nvim");
        assert!(output.status.success());
        serde_json::from_str(String::from_utf8_lossy(&output.stdout).trim()).unwrap()
    }

    fn which_nvim() -> Result<std::path::PathBuf, ()> {
        let path_var = std::env::var_os("PATH").ok_or(())?;
        std::env::split_paths(&path_var)
            .map(|dir| dir.join("nvim"))
            .find(|candidate| candidate.is_file())
            .ok_or(())
    }

    #[test]
    fn renders_the_plugin_defaults_verbatim() {
        let rendered = render_settings_lua(&NvimSettings::default());
        assert_eq!(
            rendered,
            r#"-- BEGIN BLACK ATOM LIVERY CONFIG
vim.g.black_atom_core_config = {
    term_colors = true,
    styles = {
        transparency = "none",
        ending_tildes = false,
        cmp_kind_color_mode = "bg",
        dark_sidebars = true,
        dark_floats = true,
        diagnostics = {
            undercurl = false,
            background = false,
        },
        syntax = {
            comments = { italic = true },
            keywords = { bold = true },
            functions = {},
            strings = { italic = false },
            variables = {},
            messages = { bold = true },
        },
    },
}
-- END BLACK ATOM LIVERY CONFIG
"#
        );
    }

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

    #[cfg(unix)]
    #[test]
    fn test_run_with_timeout_stops_a_hung_command() {
        let mut command = Command::new("sh");
        command.args(["-c", "sleep 10"]);
        let started = Instant::now();

        let error = run_with_timeout(command, Duration::from_millis(50)).unwrap_err();

        assert!(started.elapsed() < Duration::from_secs(2));
        assert!(error.contains("timed out"), "unexpected error: {error}");
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
