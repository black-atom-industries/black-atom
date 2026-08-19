use std::collections::HashMap;
use std::path::{Path, PathBuf};

use crate::config::types::AppConfig;

use super::file_ops;
use super::{ConfigFolderOutcome, UpdateContext, UpdateResult, UpdateStatus};

/// Update every configured Obsidian configuration folder. File writes remain
/// authoritative when a running instance cannot be reloaded or targeted by its CLI.
pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let obsidian_theme = match ctx.appearance {
        "dark" => "obsidian",
        "light" => "moonstone",
        other => return UpdateResult::error(app_str, format!("Unknown appearance: {other}")),
    };
    let folders = crate::config::io::configured_config_folders(app_config);
    if folders.is_empty() {
        return UpdateResult::error(app_str, "No Obsidian config folders configured");
    }

    let mut basenames = HashMap::new();
    for folder in &folders {
        if let Some(name) = Path::new(folder)
            .parent()
            .and_then(Path::file_name)
            .and_then(|name| name.to_str())
        {
            *basenames.entry(name.to_string()).or_insert(0usize) += 1;
        }
    }

    let mut outcomes = Vec::with_capacity(folders.len());
    for folder in &folders {
        let duplicate_basename = Path::new(folder)
            .parent()
            .and_then(Path::file_name)
            .and_then(|name| name.to_str())
            .and_then(|name| basenames.get(name))
            .is_some_and(|count| *count > 1);
        outcomes.push(update_config_folder(
            folder,
            obsidian_theme,
            ctx,
            duplicate_basename,
        ));
    }

    let failed = outcomes
        .iter()
        .filter(|outcome| outcome.status == UpdateStatus::Error)
        .count();
    let warnings: Vec<&str> = outcomes
        .iter()
        .flat_map(|outcome| {
            [
                outcome.message.as_deref(),
                outcome.reload_warning.as_deref(),
            ]
        })
        .flatten()
        .collect();
    let message = if failed > 0 {
        let summary = format!(
            "{failed} of {} Obsidian config folder(s) failed",
            outcomes.len()
        );
        if warnings.is_empty() {
            Some(summary)
        } else {
            Some(format!("{summary}; warnings: {}", warnings.join("; ")))
        }
    } else if !warnings.is_empty() {
        Some(format!(
            "{} Obsidian config folder(s) updated; warnings reported: {}",
            outcomes.len(),
            warnings.join("; ")
        ))
    } else {
        None
    };

    UpdateResult {
        app: app_str.to_string(),
        status: if failed > 0 {
            UpdateStatus::Error
        } else {
            UpdateStatus::Done
        },
        message,
        config_folders: Some(outcomes),
        duration_ms: None,
    }
}

fn update_config_folder(
    folder: &str,
    obsidian_theme: &str,
    ctx: &UpdateContext,
    duplicate_basename: bool,
) -> ConfigFolderOutcome {
    let config_folder = PathBuf::from(shellexpand::tilde(folder).to_string());
    let appearance_path = config_folder.join("appearance.json");
    let appearance = appearance_path.to_string_lossy().into_owned();
    if let Err(error) =
        file_ops::jsonc::patch_jsonc_file(appearance.clone(), "theme", obsidian_theme)
    {
        return ConfigFolderOutcome {
            config_folder: folder.to_string(),
            status: UpdateStatus::Error,
            message: Some(error),
            reload_warning: None,
        };
    }
    if let Err(error) = file_ops::jsonc::patch_jsonc_file(appearance, "cssTheme", "Black Atom") {
        return ConfigFolderOutcome {
            config_folder: folder.to_string(),
            status: UpdateStatus::Error,
            message: Some(error),
            reload_warning: None,
        };
    }

    let mut message = None;
    let style_settings_path = config_folder
        .join("plugins")
        .join("obsidian-style-settings")
        .join("data.json");
    if style_settings_path.is_file() {
        let variant_key = match ctx.appearance {
            "dark" => "black-atom-variants@@dark-theme-variant",
            _ => "black-atom-variants@@light-theme-variant",
        };
        if let Err(error) = file_ops::jsonc::patch_jsonc_file(
            style_settings_path.to_string_lossy().into_owned(),
            variant_key,
            ctx.theme_key,
        ) {
            log::warn!("Style settings patch failed for {folder} (non-fatal): {error}");
            message = Some(format!("Style Settings patch failed: {error}"));
        }
    }

    let reload_warning = if duplicate_basename {
        Some(
            "Vault basename is shared; reload skipped because the CLI selector is ambiguous"
                .to_string(),
        )
    } else if is_running() {
        config_folder
            .parent()
            .ok_or_else(|| "Config folder has no vault root".to_string())
            .and_then(reload)
            .err()
    } else {
        Some("Obsidian is not running; reload deferred until next launch".to_string())
    };
    ConfigFolderOutcome {
        config_folder: folder.to_string(),
        status: UpdateStatus::Done,
        message,
        reload_warning,
    }
}

fn is_running() -> bool {
    std::process::Command::new("pgrep")
        .args(["-x", "Obsidian"])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// The Obsidian CLI accepts a vault selector before the command. The vault root
/// is derived from the configuration folder, and the selector is its basename.
fn reload(vault_root: &Path) -> Result<(), String> {
    let name = vault_root
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| {
            format!(
                "Cannot determine Obsidian vault name for {}",
                vault_root.display()
            )
        })?;
    let output = std::process::Command::new("obsidian")
        .args([&format!("vault={name}"), "reload"])
        .output()
        .map_err(|error| format!("Failed to run obsidian reload: {error}"))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(format!("obsidian vault={name} reload returned non-zero"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reload_name_uses_derived_config_folder_root_basename() {
        assert_eq!(Path::new("/notes").file_name().unwrap(), "notes");
    }

    #[test]
    fn test_updates_config_folders_independently_and_reports_missing_folder() {
        let first = tempfile::TempDir::new_in(dirs::home_dir().unwrap()).unwrap();
        let second = tempfile::TempDir::new_in(dirs::home_dir().unwrap()).unwrap();
        for config_folder in [first.path(), second.path()] {
            std::fs::create_dir_all(config_folder.join(".obsidian")).unwrap();
            std::fs::write(config_folder.join(".obsidian/appearance.json"), "{}\n").unwrap();
        }
        let missing = first.path().join("missing");
        let config = AppConfig {
            enabled: true,
            config_path: None,
            config_folders: Some(vec![
                first
                    .path()
                    .join(".obsidian")
                    .to_string_lossy()
                    .into_owned(),
                missing.join(".obsidian").to_string_lossy().into_owned(),
                second
                    .path()
                    .join(".obsidian")
                    .to_string_lossy()
                    .into_owned(),
            ]),
            themes_path: None,
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let context = UpdateContext {
            theme_key: "black-atom-test",
            appearance: "dark",
            collection_key: "test",
            theme_label: None,
            themes_path: None,
        };
        let result = update("obsidian", &config, &context);
        assert_eq!(result.status, UpdateStatus::Error);
        let outcomes = result.config_folders.unwrap();
        assert_eq!(outcomes.len(), 3);
        assert_eq!(outcomes[0].status, UpdateStatus::Done);
        assert_eq!(outcomes[1].status, UpdateStatus::Error);
        assert_eq!(outcomes[2].status, UpdateStatus::Done);
        let first_appearance =
            std::fs::read_to_string(first.path().join(".obsidian/appearance.json")).unwrap();
        assert!(first_appearance.contains("obsidian"));
        assert!(first_appearance.contains(r#""cssTheme": "Black Atom""#));
        assert!(
            std::fs::read_to_string(second.path().join(".obsidian/appearance.json"))
                .unwrap()
                .contains("obsidian")
        );
    }

    #[test]
    fn test_style_settings_failure_is_non_fatal_but_reported() {
        let config_folder = tempfile::TempDir::new_in(dirs::home_dir().unwrap()).unwrap();
        std::fs::create_dir_all(
            config_folder
                .path()
                .join(".obsidian/plugins/obsidian-style-settings"),
        )
        .unwrap();
        std::fs::write(
            config_folder.path().join(".obsidian/appearance.json"),
            "{}\n",
        )
        .unwrap();
        std::fs::write(
            config_folder
                .path()
                .join(".obsidian/plugins/obsidian-style-settings/data.json"),
            "not json\n",
        )
        .unwrap();
        let config = AppConfig {
            enabled: true,
            config_path: None,
            config_folders: Some(vec![config_folder
                .path()
                .join(".obsidian")
                .to_string_lossy()
                .into_owned()]),
            themes_path: None,
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let context = UpdateContext {
            theme_key: "black-atom-test",
            appearance: "dark",
            collection_key: "test",
            theme_label: None,
            themes_path: None,
        };

        let result = update("obsidian", &config, &context);
        assert_eq!(result.status, UpdateStatus::Done);
        assert!(result
            .message
            .as_deref()
            .unwrap()
            .contains("Style Settings"));
        assert!(result.config_folders.unwrap()[0]
            .message
            .as_deref()
            .unwrap()
            .contains("Style Settings"));
    }

    #[test]
    fn test_update_outcome_keeps_the_portable_config_folder_identity() {
        let home = dirs::home_dir().unwrap();
        let folder = tempfile::TempDir::new_in(&home).unwrap();
        std::fs::write(folder.path().join("appearance.json"), "{}\n").unwrap();
        let relative = folder.path().strip_prefix(home).unwrap();
        let portable = format!("~/{}", relative.to_string_lossy());
        let config = AppConfig {
            enabled: true,
            config_path: None,
            config_folders: Some(vec![portable.clone()]),
            themes_path: None,
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let context = UpdateContext {
            theme_key: "black-atom-test",
            appearance: "dark",
            collection_key: "test",
            theme_label: None,
            themes_path: None,
        };

        let result = update("obsidian", &config, &context);

        assert_eq!(result.config_folders.unwrap()[0].config_folder, portable);
    }

    #[test]
    fn test_empty_config_folders_are_reported() {
        let config = AppConfig {
            enabled: true,
            config_path: None,
            config_folders: Some(Vec::new()),
            themes_path: None,
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };
        let context = UpdateContext {
            theme_key: "x",
            appearance: "dark",
            collection_key: "x",
            theme_label: None,
            themes_path: None,
        };
        assert_eq!(
            update("obsidian", &config, &context).status,
            UpdateStatus::Error
        );
    }
}
