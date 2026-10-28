use std::path::{Path, PathBuf};

use crate::config::types::AppConfig;

use super::{UpdateContext, UpdateResult};

const REMOTE_CONTROL_HINT: &str = "Turn on Remote Control in Rex → Settings → Rex Server";

pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let Some(rex) = app_config.config_path.as_deref() else {
        return UpdateResult::error(app_str, "Missing config_path");
    };
    let rex = shellexpand::tilde(rex).to_string();
    if !Path::new(&rex).is_file() {
        return UpdateResult::error(app_str, format!("Rex not found at {rex}"));
    }
    update_with(app_str, app_config, ctx, |args| run_rex(&rex, args))
}

/// Rex stores imported themes in its own settings and reads no theme folder,
/// so the import is the switch: importing a name Rex already holds updates
/// that theme in place and selects it.
fn update_with<F>(
    app_str: &str,
    app_config: &AppConfig,
    ctx: &UpdateContext,
    mut rex: F,
) -> UpdateResult
where
    F: FnMut(&[&str]) -> Result<String, String>,
{
    let Some(themes_path) = &app_config.themes_path else {
        return UpdateResult::error(app_str, "Missing themes_path");
    };
    let link = PathBuf::from(shellexpand::tilde(themes_path).to_string()).join(ctx.theme_key);
    if !link.exists() {
        return UpdateResult::error(
            app_str,
            format!("{} is missing — run SET UP for Rex", link.display()),
        );
    }

    let clients =
        match rex(&["client", "ls", "--json"]).and_then(|stdout| parse_app_clients(&stdout)) {
            Ok(clients) => clients,
            Err(error) if error.contains("server is not running") => {
                return UpdateResult::skipped(
                    app_str,
                    "Rex is not running — the theme applies on the next livery apply",
                );
            }
            Err(error) => return UpdateResult::error(app_str, error),
        };
    if clients.is_empty() {
        return UpdateResult::skipped(
            app_str,
            "No Rex app is connected — the theme applies on the next livery apply",
        );
    }

    let path_arg = format!("path={}", link.display());
    let mode_arg = format!("mode={}", ctx.appearance);
    let mut failures = Vec::new();
    for client in &clients {
        let applied = rex(&["-C", client, "do", "client.theme.import", &path_arg]).and_then(|_| {
            rex(&[
                "-C",
                client,
                "do",
                "client.appearance.switch_mode",
                &mode_arg,
            ])
        });
        if let Err(error) = applied {
            let error = if error.contains("not accepting actions") {
                REMOTE_CONTROL_HINT.to_string()
            } else {
                error
            };
            failures.push(format!("{client}: {error}"));
        }
    }

    if failures.is_empty() {
        log::info!(
            "Imported {} into {} Rex app(s)",
            ctx.theme_key,
            clients.len()
        );
        UpdateResult::done(app_str)
    } else {
        UpdateResult::error(app_str, failures.join("; "))
    }
}

/// IDs of the connected Rex apps. Other clients, such as CLI connections,
/// take no client actions.
fn parse_app_clients(stdout: &str) -> Result<Vec<String>, String> {
    let response: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Rex returned invalid client JSON: {e}"))?;
    let clients = response
        .get("clients")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| "Rex client response has no clients array".to_string())?;

    Ok(clients
        .iter()
        .filter(|client| {
            client
                .pointer("/info/kind")
                .and_then(serde_json::Value::as_str)
                == Some("app")
        })
        .filter_map(|client| client.get("client_id").and_then(serde_json::Value::as_str))
        .map(str::to_string)
        .collect())
}

/// `--autostart=false` keeps livery from starting a Rex server of its own.
fn run_rex(rex: &str, args: &[&str]) -> Result<String, String> {
    let output = std::process::Command::new(rex)
        .arg("--autostart=false")
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run rex: {e}"))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).into_owned());
    }
    let stderr = String::from_utf8_lossy(&output.stderr);
    let message = stderr.trim().trim_start_matches("Error: ");
    Err(if message.is_empty() {
        format!("rex exited with {}", output.status)
    } else {
        message.to_string()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const CLIENTS: &str = r#"{"clients":[
        {"client_id":"client:cli","principal":{"kind":"peer"}},
        {"client_id":"client:mac","info":{"kind":"app","name":"Rex Beta"}},
        {"client_id":"client:studio","info":{"kind":"app","name":"Rex Beta"}}
    ]}"#;

    struct Fixture {
        _dir: tempfile::TempDir,
        app_config: AppConfig,
    }

    fn fixture() -> Fixture {
        let dir = tempfile::TempDir::new().unwrap();
        std::fs::write(
            dir.path().join("black-atom-terra-fall-dark"),
            "background = #140b06\n",
        )
        .unwrap();
        let app_config = AppConfig {
            enabled: true,
            config_folders: None,
            config_path: Some("/fake/rex".to_string()),
            themes_path: Some(dir.path().to_string_lossy().into_owned()),
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        Fixture {
            _dir: dir,
            app_config,
        }
    }

    fn ctx() -> UpdateContext<'static> {
        UpdateContext {
            theme_key: "black-atom-terra-fall-dark",
            appearance: "dark",
            collection_key: "terra",
            theme_label: None,
            themes_path: None,
        }
    }

    /// Runs the updater against canned `rex` replies and returns the result
    /// with every call made, joined by spaces.
    fn run<F>(fixture: &Fixture, mut reply: F) -> (UpdateResult, Vec<String>)
    where
        F: FnMut(&[&str]) -> Result<String, String>,
    {
        let mut calls = Vec::new();
        let result = update_with("rex", &fixture.app_config, &ctx(), |args| {
            calls.push(args.join(" "));
            reply(args)
        });
        (result, calls)
    }

    fn connected(args: &[&str]) -> Result<String, String> {
        if args[0] == "client" {
            Ok(CLIENTS.to_string())
        } else {
            Ok("{}".to_string())
        }
    }

    #[test]
    fn test_imports_and_switches_appearance_in_every_app() {
        let f = fixture();
        let link = Path::new(f.app_config.themes_path.as_deref().unwrap())
            .join("black-atom-terra-fall-dark");

        let (result, calls) = run(&f, connected);

        assert_eq!(result.status, super::super::UpdateStatus::Done);
        let mut expected = vec!["client ls --json".to_string()];
        for client in ["client:mac", "client:studio"] {
            expected.push(format!(
                "-C {client} do client.theme.import path={}",
                link.display()
            ));
            expected.push(format!(
                "-C {client} do client.appearance.switch_mode mode=dark"
            ));
        }
        assert_eq!(calls, expected);
    }

    #[test]
    fn test_rerun_makes_the_same_calls() {
        let f = fixture();
        let (_, first) = run(&f, connected);
        let (_, second) = run(&f, connected);
        assert_eq!(first, second);
    }

    #[test]
    fn test_missing_link_asks_for_setup() {
        let mut f = fixture();
        f.app_config.themes_path = Some("/nonexistent/rex".to_string());

        let (result, calls) = run(&f, connected);

        assert_eq!(result.status, super::super::UpdateStatus::Error);
        assert!(result.message.unwrap().contains("run SET UP for Rex"));
        assert!(calls.is_empty());
    }

    #[test]
    fn test_skips_when_rex_is_not_running() {
        let f = fixture();
        let (result, calls) = run(&f, |_| {
            Err("rex server is not running\nrex server autostart is disabled".to_string())
        });

        assert_eq!(result.status, super::super::UpdateStatus::Skipped);
        assert!(result.message.unwrap().contains("not running"));
        assert_eq!(calls, vec!["client ls --json"]);
    }

    #[test]
    fn test_skips_when_no_app_is_connected() {
        let f = fixture();
        let (result, calls) = run(&f, |_| {
            Ok(
                r#"{"clients":[{"client_id":"client:cli","principal":{"kind":"peer"}}]}"#
                    .to_string(),
            )
        });

        assert_eq!(result.status, super::super::UpdateStatus::Skipped);
        assert!(result.message.unwrap().contains("No Rex app"));
        assert_eq!(calls, vec!["client ls --json"]);
    }

    #[test]
    fn test_remote_control_off_fails_with_hint() {
        let f = fixture();
        let (result, calls) = run(&f, |args| {
            if args[0] == "client" {
                return Ok(
                    r#"{"clients":[{"client_id":"client:mac","info":{"kind":"app"}}]}"#.to_string(),
                );
            }
            Err("Rex.app is not accepting actions. Turn on Remote Control in its Settings under Rex Server.".to_string())
        });

        assert_eq!(result.status, super::super::UpdateStatus::Error);
        assert_eq!(
            result.message.as_deref(),
            Some(format!("client:mac: {REMOTE_CONTROL_HINT}").as_str())
        );
        assert_eq!(calls.len(), 2, "no appearance switch after a failed import");
    }

    #[test]
    fn test_one_failing_app_does_not_stop_the_others() {
        let f = fixture();
        let (result, calls) = run(&f, |args| match args {
            ["client", ..] => Ok(CLIENTS.to_string()),
            ["-C", "client:mac", ..] => Err("client disconnected".to_string()),
            _ => Ok("{}".to_string()),
        });

        assert_eq!(result.status, super::super::UpdateStatus::Error);
        assert_eq!(
            result.message.as_deref(),
            Some("client:mac: client disconnected")
        );
        assert!(calls
            .iter()
            .any(|call| call.starts_with("-C client:studio do client.appearance.switch_mode")));
    }
}
