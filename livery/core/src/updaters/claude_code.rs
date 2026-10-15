use std::path::{Path, PathBuf};

use crate::config::types::{AppConfig, AppName};

use super::file_ops;
use super::{ConfigFolderOutcome, UpdateContext, UpdateResult, UpdateStatus};

/// The custom theme livery rewrites on every switch. Claude Code names a custom theme after its
/// file in `themes/`, so the `theme` setting stays `custom:black-atom` across switches.
const THEME_NAME: &str = "black-atom";

/// Write the selected theme into every configured Claude Code config folder.
pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let folders = crate::config::io::configured_config_folders(AppName::ClaudeCode, app_config);
    if folders.is_empty() {
        return UpdateResult::error(app_str, "No Claude Code config folders configured");
    }
    let Some(themes_path) = &app_config.themes_path else {
        return UpdateResult::error(app_str, "Missing themes_path");
    };

    let source_path = PathBuf::from(shellexpand::tilde(themes_path).to_string())
        .join(ctx.collection_key)
        .join(format!("{}.json", ctx.theme_key));
    let theme = match std::fs::read_to_string(&source_path) {
        Ok(theme) => theme,
        Err(e) => {
            return UpdateResult::error(
                app_str,
                format!(
                    "Failed to read Claude Code theme {}: {e}",
                    source_path.display()
                ),
            );
        }
    };

    let outcomes: Vec<ConfigFolderOutcome> = folders
        .iter()
        .map(|folder| update_config_folder(folder, &theme))
        .collect();

    let failed = outcomes
        .iter()
        .filter(|outcome| outcome.status == UpdateStatus::Error)
        .count();
    let messages: Vec<&str> = outcomes
        .iter()
        .filter_map(|outcome| outcome.message.as_deref())
        .collect();
    let (status, message) = if failed > 0 {
        (
            UpdateStatus::Error,
            Some(format!(
                "{failed} of {} Claude Code config folder(s) failed: {}",
                outcomes.len(),
                messages.join("; ")
            )),
        )
    } else if !messages.is_empty() {
        (
            UpdateStatus::Skipped,
            Some(format!("Config patched; {}", messages.join("; "))),
        )
    } else {
        (UpdateStatus::Done, None)
    };

    UpdateResult {
        app: app_str.to_string(),
        status,
        message,
        config_folders: Some(outcomes),
        duration_ms: None,
    }
}

/// The theme file is written before the pointer is checked, so `/theme` can list the theme and
/// set the pointer itself.
fn update_config_folder(folder: &str, theme: &str) -> ConfigFolderOutcome {
    let folder_path = PathBuf::from(shellexpand::tilde(folder).to_string());
    let settings_path = folder_path.join("settings.json");
    if !settings_path.is_file() {
        return ConfigFolderOutcome {
            config_folder: folder.to_string(),
            status: UpdateStatus::Error,
            message: Some(format!(
                "{} is not a Claude Code config folder: no settings.json",
                folder_path.display()
            )),
            reload_warning: None,
        };
    }
    let target = folder_path
        .join("themes")
        .join(format!("{THEME_NAME}.json"));
    let (status, message) = match file_ops::file::write_home_file(&target.to_string_lossy(), theme)
    {
        Err(e) => (UpdateStatus::Error, Some(e)),
        Ok(changed) => {
            log::info!(
                "Updated Claude Code theme: {} (changed={changed})",
                target.display()
            );
            match check_pointer(&settings_path) {
                Ok(()) => (UpdateStatus::Done, None),
                Err(e) => (UpdateStatus::Skipped, Some(e)),
            }
        }
    };
    ConfigFolderOutcome {
        config_folder: folder.to_string(),
        status,
        message,
        reload_warning: None,
    }
}

fn check_pointer(settings_path: &Path) -> Result<(), String> {
    let display = settings_path.display();
    let expected = format!("custom:{THEME_NAME}");
    let content = std::fs::read_to_string(settings_path)
        .map_err(|e| format!("Failed to read {display}: {e}"))?;
    let settings: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse {display}: {e}"))?;
    if settings.get("theme").and_then(|v| v.as_str()) == Some(expected.as_str()) {
        Ok(())
    } else {
        Err(format!("Set \"theme\": \"{expected}\" in {display}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join(name)
    }

    /// A temp root under `$HOME`, as the home guard requires, holding a managed themes dir.
    fn root_with_themes() -> (tempfile::TempDir, PathBuf) {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();
        let managed = root.path().join("managed");
        std::fs::create_dir_all(managed.join("default")).unwrap();
        std::fs::copy(
            fixture_path("themes/claude-code-theme.json"),
            managed.join("default/black-atom-default-dark.json"),
        )
        .unwrap();
        (root, managed)
    }

    fn config_folder(root: &Path, name: &str, settings_fixture: Option<&str>) -> PathBuf {
        let folder = root.join(name);
        std::fs::create_dir_all(&folder).unwrap();
        if let Some(fixture) = settings_fixture {
            std::fs::copy(fixture_path(fixture), folder.join("settings.json")).unwrap();
        }
        folder
    }

    fn app_config(managed: &Path, folders: &[&Path]) -> AppConfig {
        AppConfig {
            enabled: true,
            config_folders: Some(
                folders
                    .iter()
                    .map(|folder| folder.to_string_lossy().into_owned())
                    .collect(),
            ),
            config_path: None,
            themes_path: Some(managed.to_string_lossy().into_owned()),
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        }
    }

    fn ctx() -> UpdateContext<'static> {
        UpdateContext {
            theme_key: "black-atom-default-dark",
            appearance: "dark",
            collection_key: "default",
            theme_label: None,
            themes_path: None,
        }
    }

    fn theme_fixture() -> String {
        std::fs::read_to_string(fixture_path("themes/claude-code-theme.json")).unwrap()
    }

    #[test]
    fn writes_the_selected_theme_into_every_config_folder() {
        let (root, managed) = root_with_themes();
        let main = config_folder(
            root.path(),
            ".claude",
            Some("jsonc/claude-code-settings.json"),
        );
        let work = config_folder(
            root.path(),
            ".claude-work",
            Some("jsonc/claude-code-settings.json"),
        );

        let result = update(
            "claude-code",
            &app_config(&managed, &[&main, &work]),
            &ctx(),
        );

        assert_eq!(result.status, UpdateStatus::Done, "{result:?}");
        assert_eq!(result.config_folders.unwrap().len(), 2);
        for folder in [&main, &work] {
            let written = std::fs::read_to_string(folder.join("themes/black-atom.json")).unwrap();
            assert_eq!(written, theme_fixture());
        }
    }

    #[test]
    fn applying_twice_is_idempotent() {
        let (root, managed) = root_with_themes();
        let main = config_folder(
            root.path(),
            ".claude",
            Some("jsonc/claude-code-settings.json"),
        );
        let config = app_config(&managed, &[&main]);
        update("claude-code", &config, &ctx());
        let first = std::fs::read_to_string(main.join("themes/black-atom.json")).unwrap();

        let result = update("claude-code", &config, &ctx());

        assert_eq!(result.status, UpdateStatus::Done);
        assert_eq!(
            std::fs::read_to_string(main.join("themes/black-atom.json")).unwrap(),
            first
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_settings_file_keeps_the_theme_in_the_config_folder() {
        let (root, managed) = root_with_themes();
        let main = config_folder(root.path(), ".claude", None);
        let dots = root.path().join("dots/.claude");
        std::fs::create_dir_all(&dots).unwrap();
        std::fs::copy(
            fixture_path("jsonc/claude-code-settings.json"),
            dots.join("settings.json"),
        )
        .unwrap();
        std::os::unix::fs::symlink(dots.join("settings.json"), main.join("settings.json")).unwrap();

        let result = update("claude-code", &app_config(&managed, &[&main]), &ctx());

        assert_eq!(result.status, UpdateStatus::Done, "{result:?}");
        assert!(main.join("themes/black-atom.json").is_file());
        assert!(!dots.join("themes").exists());
    }

    #[test]
    fn writes_the_theme_and_flags_a_missing_pointer() {
        let (root, managed) = root_with_themes();
        let main = config_folder(
            root.path(),
            ".claude",
            Some("jsonc/claude-code-settings.json"),
        );
        let work = config_folder(
            root.path(),
            ".claude-work",
            Some("jsonc/claude-code-settings-builtin.json"),
        );

        let result = update(
            "claude-code",
            &app_config(&managed, &[&main, &work]),
            &ctx(),
        );

        assert_eq!(result.status, UpdateStatus::Skipped);
        let message = result.message.unwrap();
        assert!(message.starts_with("Config patched;"), "{message}");
        assert!(message.contains("\"theme\": \"custom:black-atom\""));
        assert!(message.contains(".claude-work"));
        assert!(work.join("themes/black-atom.json").is_file());
    }

    #[test]
    fn a_folder_without_settings_is_an_error_and_gets_no_theme() {
        let (root, managed) = root_with_themes();
        let downloads = config_folder(root.path(), "Downloads", None);

        let result = update("claude-code", &app_config(&managed, &[&downloads]), &ctx());

        assert_eq!(result.status, UpdateStatus::Error);
        let message = result.message.unwrap();
        assert!(message.contains("no settings.json"), "{message}");
        assert!(!downloads.join("themes").exists());
    }

    #[test]
    fn a_missing_config_folder_is_an_error_and_is_not_created() {
        let (root, managed) = root_with_themes();
        let missing = root.path().join(".claude-wrk");

        let result = update("claude-code", &app_config(&managed, &[&missing]), &ctx());

        assert_eq!(result.status, UpdateStatus::Error);
        assert!(!missing.exists());
    }

    #[test]
    fn no_config_folders_is_an_error() {
        let (_root, managed) = root_with_themes();

        let result = update("claude-code", &app_config(&managed, &[]), &ctx());

        assert_eq!(result.status, UpdateStatus::Error);
    }
}
