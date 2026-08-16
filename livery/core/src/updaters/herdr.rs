use std::path::{Path, PathBuf};

use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

const BEGIN_MARKER: &str = "# BEGIN BLACK ATOM LIVERY THEME";
const END_MARKER: &str = "# END BLACK ATOM LIVERY THEME";
const CONFLICTING_THEME_TABLES: &str = r"^\s*\[(?:theme|theme\.custom)\]\s*(?:#.*)?$";

pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    update_with_reload(app_str, app_config, ctx, || {
        reload_all_sessions(&app_config.config_path)
    })
}

fn update_with_reload<F>(
    app_str: &str,
    app_config: &AppConfig,
    ctx: &UpdateContext,
    reload_config: F,
) -> UpdateResult
where
    F: FnOnce() -> Result<ReloadReport, String>,
{
    let Some(themes_path) = &app_config.themes_path else {
        return UpdateResult::error(app_str, "Missing themes_path");
    };
    let themes_path = shellexpand::tilde(themes_path).to_string();

    let source_path = PathBuf::from(themes_path)
        .join(ctx.collection_key)
        .join(format!("{}.toml", ctx.theme_key));
    let fragment = match std::fs::read_to_string(&source_path) {
        Ok(fragment) => fragment,
        Err(e) => {
            return UpdateResult::error(
                app_str,
                format!("Failed to read Herdr theme {}: {e}", source_path.display()),
            );
        }
    };

    let patch = file_ops::managed_block::patch_toml_managed_block_file(
        app_config.config_path.clone(),
        &fragment,
        BEGIN_MARKER,
        END_MARKER,
        CONFLICTING_THEME_TABLES,
    );
    let patch = match patch {
        Ok(patch) => patch,
        Err(e) => return UpdateResult::error(app_str, e),
    };

    log::info!(
        "Updated Herdr config: {} (changed={}, appended={})",
        app_config.config_path,
        patch.changed,
        patch.appended
    );

    match reload_config() {
        Ok(report) if report.status == "applied" => UpdateResult::done(app_str),
        Ok(report) => {
            let diagnostics = if report.diagnostics.is_empty() {
                String::new()
            } else {
                format!(": {}", report.diagnostics.join("; "))
            };
            UpdateResult::skipped(
                app_str,
                format!(
                    "Config patched; Herdr reload reported {}{}",
                    report.status, diagnostics
                ),
            )
        }
        Err(message) => UpdateResult::skipped(
            app_str,
            format!("Config patched; live reload failed: {message}"),
        ),
    }
}

#[derive(Debug, PartialEq, Eq)]
struct ReloadReport {
    status: String,
    diagnostics: Vec<String>,
}

fn reload_all_sessions(config_path: &str) -> Result<ReloadReport, String> {
    let mut sockets = discover_session_sockets(config_path)?;
    match list_registered_session_sockets() {
        Ok(registered) => sockets.extend(registered),
        Err(error) => log::warn!("Could not list registered Herdr sessions: {error}"),
    }
    sockets.sort();
    sockets.dedup();

    if sockets.is_empty() {
        log::info!("Herdr not running — config applies on next launch");
        return Ok(ReloadReport {
            status: "applied".to_string(),
            diagnostics: vec![],
        });
    }

    reload_sessions_with(&sockets, reload_socket)
}

fn discover_session_sockets(config_path: &str) -> Result<Vec<PathBuf>, String> {
    let config_path = shellexpand::tilde(config_path).to_string();
    let config_dir = PathBuf::from(&config_path)
        .parent()
        .ok_or_else(|| format!("No parent directory for {config_path}"))?
        .to_path_buf();
    let mut sockets = Vec::new();

    let default_socket = config_dir.join("herdr.sock");
    if default_socket.exists() {
        sockets.push(default_socket);
    }

    let sessions_dir = config_dir.join("sessions");
    match std::fs::read_dir(&sessions_dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let socket = entry.path().join("herdr.sock");
                if socket.exists() {
                    sockets.push(socket);
                }
            }
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(format!(
                "Failed to inspect Herdr sessions at {}: {error}",
                sessions_dir.display()
            ));
        }
    }

    sockets.sort();
    sockets.dedup();
    Ok(sockets)
}

fn list_registered_session_sockets() -> Result<Vec<PathBuf>, String> {
    let output = std::process::Command::new("herdr")
        .args(["session", "list", "--json"])
        .output()
        .map_err(|e| format!("Failed to run herdr: {e}"))?;
    if !output.status.success() {
        return Err(format!("herdr session list exited with {}", output.status));
    }

    parse_session_sockets(&String::from_utf8_lossy(&output.stdout))
}

fn parse_session_sockets(stdout: &str) -> Result<Vec<PathBuf>, String> {
    let response: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Herdr returned invalid session JSON: {e}"))?;
    let sessions = response
        .get("sessions")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| "Herdr session response has no sessions array".to_string())?;

    sessions
        .iter()
        .filter(|session| {
            session
                .get("running")
                .and_then(serde_json::Value::as_bool)
                .unwrap_or(false)
        })
        .map(|session| {
            session
                .get("socket_path")
                .and_then(serde_json::Value::as_str)
                .map(PathBuf::from)
                .ok_or_else(|| "Running Herdr session has no socket_path".to_string())
        })
        .collect()
}

fn reload_sessions_with<F>(sockets: &[PathBuf], mut reload: F) -> Result<ReloadReport, String>
where
    F: FnMut(&Path) -> Result<ReloadReport, String>,
{
    let mut applied = 0;
    let mut diagnostics = Vec::new();

    for socket in sockets {
        match reload(socket) {
            Ok(report) if report.status == "applied" => applied += 1,
            Ok(report) => {
                let detail = if report.diagnostics.is_empty() {
                    report.status
                } else {
                    format!("{}: {}", report.status, report.diagnostics.join("; "))
                };
                diagnostics.push(format!("{}: {detail}", socket.display()));
            }
            Err(error) => diagnostics.push(format!("{}: {error}", socket.display())),
        }
    }

    if diagnostics.is_empty() {
        log::info!("Reloaded {applied} Herdr session(s)");
        return Ok(ReloadReport {
            status: "applied".to_string(),
            diagnostics,
        });
    }

    if applied == 0 {
        return Err(diagnostics.join("; "));
    }

    Ok(ReloadReport {
        status: "partial".to_string(),
        diagnostics,
    })
}

fn reload_socket(socket: &Path) -> Result<ReloadReport, String> {
    let output = std::process::Command::new("herdr")
        .env("HERDR_SOCKET_PATH", socket)
        .args(["server", "reload-config"])
        .output()
        .map_err(|e| format!("Failed to run herdr: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        return Err(if message.is_empty() {
            format!("herdr exited with {}", output.status)
        } else {
            format!("herdr exited with {}: {message}", output.status)
        });
    }

    parse_reload_response(&String::from_utf8_lossy(&output.stdout))
}

fn parse_reload_response(stdout: &str) -> Result<ReloadReport, String> {
    let response: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Herdr returned invalid reload JSON: {e}"))?;
    let result = response
        .get("result")
        .ok_or_else(|| "Herdr reload response has no result".to_string())?;
    if result.get("type").and_then(serde_json::Value::as_str) != Some("config_reload") {
        return Err("Herdr reload response is not a config_reload result".to_string());
    }
    let status = result
        .get("status")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Herdr reload response has no status".to_string())?;
    if !matches!(status, "applied" | "partial" | "failed") {
        return Err(format!("Herdr reload returned unknown status: {status}"));
    }
    let diagnostics = result
        .get("diagnostics")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| "Herdr reload response has no diagnostics array".to_string())?
        .iter()
        .map(|value| {
            value
                .as_str()
                .map(str::to_string)
                .ok_or_else(|| "Herdr reload diagnostic is not a string".to_string())
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(ReloadReport {
        status: status.to_string(),
        diagnostics,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture(name: &str) -> String {
        std::fs::read_to_string(
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("tests")
                .join("fixtures")
                .join(name),
        )
        .unwrap()
    }

    #[test]
    fn parses_applied_partial_and_failed_reload_results() {
        for (status, diagnostics) in [
            ("applied", "[]"),
            ("partial", "[\"invalid keys section\"]"),
            ("failed", "[\"invalid TOML\"]"),
        ] {
            let json = format!(
                r#"{{"id":"cli:server:reload-config","result":{{"type":"config_reload","status":"{status}","diagnostics":{diagnostics}}}}}"#
            );
            let report = parse_reload_response(&json).unwrap();
            assert_eq!(report.status, status);
        }
    }

    #[test]
    fn rejects_malformed_or_unexpected_reload_output() {
        for output in [
            "not json",
            r#"{"result":{"type":"ok"}}"#,
            r#"{"result":{"type":"config_reload","status":"unknown","diagnostics":[]}}"#,
            r#"{"result":{"type":"config_reload","status":"applied"}}"#,
        ] {
            assert!(parse_reload_response(output).is_err(), "output: {output}");
        }
    }

    #[cfg(unix)]
    #[test]
    fn discovers_default_named_and_symlinked_session_sockets() {
        use std::os::unix::fs::symlink;

        let root = tempfile::TempDir::new().unwrap();
        let config_path = root.path().join("config.toml");
        std::fs::write(&config_path, "").unwrap();
        std::fs::write(root.path().join("herdr.sock"), "").unwrap();

        let sessions = root.path().join("sessions");
        let imfusion = sessions.join("imfusion");
        std::fs::create_dir_all(&imfusion).unwrap();
        std::fs::write(imfusion.join("herdr.sock"), "").unwrap();

        let linked_session = tempfile::TempDir::new().unwrap();
        std::fs::write(linked_session.path().join("herdr.sock"), "").unwrap();
        symlink(linked_session.path(), sessions.join("black-atom")).unwrap();

        let sockets = discover_session_sockets(&config_path.to_string_lossy()).unwrap();
        assert_eq!(sockets.len(), 3);
        assert!(sockets.contains(&root.path().join("herdr.sock")));
        assert!(sockets.contains(&imfusion.join("herdr.sock")));
        assert!(sockets.contains(&sessions.join("black-atom/herdr.sock")));
    }

    #[test]
    fn reloads_every_discovered_session() {
        let sockets = vec![PathBuf::from("one.sock"), PathBuf::from("two.sock")];
        let mut reloaded = Vec::new();
        let report = reload_sessions_with(&sockets, |socket| {
            reloaded.push(socket.to_path_buf());
            Ok(ReloadReport {
                status: "applied".to_string(),
                diagnostics: vec![],
            })
        })
        .unwrap();

        assert_eq!(reloaded, sockets);
        assert_eq!(report.status, "applied");
        assert!(report.diagnostics.is_empty());
    }

    #[test]
    fn reports_partial_when_one_of_multiple_sessions_fails() {
        let sockets = vec![PathBuf::from("one.sock"), PathBuf::from("two.sock")];
        let report = reload_sessions_with(&sockets, |socket| {
            if socket == Path::new("one.sock") {
                Ok(ReloadReport {
                    status: "applied".to_string(),
                    diagnostics: vec![],
                })
            } else {
                Err("connection refused".to_string())
            }
        })
        .unwrap();

        assert_eq!(report.status, "partial");
        assert_eq!(report.diagnostics.len(), 1);
        assert!(report.diagnostics[0].contains("two.sock"));
    }

    #[test]
    fn reports_error_when_no_session_reloads() {
        let sockets = vec![PathBuf::from("one.sock"), PathBuf::from("two.sock")];
        let error =
            reload_sessions_with(&sockets, |_| Err("connection refused".to_string())).unwrap_err();

        assert!(error.contains("one.sock"));
        assert!(error.contains("two.sock"));
    }

    #[test]
    fn parses_only_running_registered_session_sockets() {
        let response = r#"{"sessions":[{"running":true,"socket_path":"/tmp/default.sock"},{"running":false,"socket_path":"/tmp/stopped.sock"},{"running":true,"socket_path":"/tmp/work.sock"}]}"#;
        let sockets = parse_session_sockets(response).unwrap();

        assert_eq!(
            sockets,
            vec![
                PathBuf::from("/tmp/default.sock"),
                PathBuf::from("/tmp/work.sock")
            ]
        );
    }

    #[test]
    fn no_running_session_is_a_successful_noop() {
        let report = reload_sessions_with(&[], |_| unreachable!()).unwrap();
        assert_eq!(report.status, "applied");
    }

    #[test]
    fn expands_portable_themes_path_and_applies_selected_fragment() {
        let home = dirs::home_dir().unwrap();
        let themes = tempfile::TempDir::new_in(&home).unwrap();
        let source_dir = themes.path().join("terra");
        std::fs::create_dir(&source_dir).unwrap();
        std::fs::write(
            source_dir.join("black-atom-terra-summer-day.toml"),
            fixture("themes/herdr-theme.toml"),
        )
        .unwrap();
        let target = tempfile::NamedTempFile::new_in(&home).unwrap();
        std::fs::write(target.path(), fixture("text/herdr-config.toml")).unwrap();
        let portable_themes_path = format!(
            "~/{}",
            themes.path().strip_prefix(&home).unwrap().to_string_lossy()
        );
        let config = AppConfig {
            enabled: true,
            config_path: target.path().to_string_lossy().to_string(),
            themes_path: Some(portable_themes_path),
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let ctx = UpdateContext {
            theme_key: "black-atom-terra-summer-day",
            appearance: "light",
            collection_key: "terra",
            theme_label: None,
            themes_path: config.themes_path.clone(),
        };

        let result = update_with_reload("herdr", &config, &ctx, || {
            Ok(ReloadReport {
                status: "applied".to_string(),
                diagnostics: vec![],
            })
        });

        assert_eq!(result.status, super::super::UpdateStatus::Done);
        assert_eq!(
            std::fs::read_to_string(target.path()).unwrap(),
            fixture("text/herdr-config-expected.toml")
        );
    }

    #[test]
    fn reload_failure_is_degraded_after_successful_patch() {
        let home = dirs::home_dir().unwrap();
        let themes = tempfile::TempDir::new_in(&home).unwrap();
        let source_dir = themes.path().join("terra");
        std::fs::create_dir(&source_dir).unwrap();
        std::fs::write(
            source_dir.join("black-atom-terra-summer-day.toml"),
            fixture("themes/herdr-theme.toml"),
        )
        .unwrap();
        let target = tempfile::NamedTempFile::new_in(&home).unwrap();
        std::fs::write(target.path(), fixture("text/herdr-config.toml")).unwrap();
        let config = AppConfig {
            enabled: true,
            config_path: target.path().to_string_lossy().to_string(),
            themes_path: Some(themes.path().to_string_lossy().to_string()),
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let ctx = UpdateContext {
            theme_key: "black-atom-terra-summer-day",
            appearance: "light",
            collection_key: "terra",
            theme_label: None,
            themes_path: config.themes_path.clone(),
        };

        let result = update_with_reload("herdr", &config, &ctx, || {
            Err("server not running".to_string())
        });

        assert_eq!(result.status, super::super::UpdateStatus::Skipped);
        assert!(result.message.unwrap().contains("server not running"));
        assert_eq!(
            std::fs::read_to_string(target.path()).unwrap(),
            fixture("text/herdr-config-expected.toml")
        );
    }

    #[test]
    fn missing_selected_theme_is_an_update_error() {
        let home = dirs::home_dir().unwrap();
        let themes = tempfile::TempDir::new_in(&home).unwrap();
        let target = tempfile::NamedTempFile::new_in(&home).unwrap();
        let config = AppConfig {
            enabled: true,
            config_path: target.path().to_string_lossy().to_string(),
            themes_path: Some(themes.path().to_string_lossy().to_string()),
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let ctx = UpdateContext {
            theme_key: "black-atom-default-dark",
            appearance: "dark",
            collection_key: "default",
            theme_label: None,
            themes_path: config.themes_path.clone(),
        };

        let result = update("herdr", &config, &ctx);
        assert_eq!(result.status, super::super::UpdateStatus::Error);
        assert!(result
            .message
            .unwrap()
            .contains("Failed to read Herdr theme"));
    }
}
