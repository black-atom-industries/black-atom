use std::fs;
use std::path::PathBuf;

use super::types::Config;

/// Path to the livery config file.
fn config_path() -> PathBuf {
    crate::paths::livery_config_dir().join("config.json")
}

/// Livery's config used to live under `~/.config` unconditionally. On a
/// machine with `$XDG_CONFIG_HOME` pointing elsewhere the new path is a
/// different file, so the old one is copied over once.
fn migrate_legacy_config() {
    let target = config_path();
    if target.exists() {
        return;
    }
    let Some(home) = dirs::home_dir() else { return };
    let legacy = home
        .join(".config")
        .join("black-atom")
        .join("livery")
        .join("config.json");
    if legacy == target || !legacy.is_file() {
        return;
    }

    let Some(parent) = target.parent() else {
        return;
    };
    if let Err(e) = fs::create_dir_all(parent) {
        log::warn!("Failed to create the config dir for migration: {e}");
        return;
    }
    match fs::copy(&legacy, &target) {
        Ok(_) => log::info!(
            "Migrated livery config from {} to {}",
            legacy.display(),
            target.display()
        ),
        Err(e) => log::warn!("Failed to migrate the livery config: {e}"),
    }
}

/// Merge user config with defaults — fills in missing fields from the default config.
/// This intentionally hydrates the user's config with all default apps (disabled).
/// When save_config is called, all apps are written to disk — this ensures the config
/// file always contains the full list of supported apps for the settings UI.
fn merge_with_defaults(mut user_config: Config) -> Config {
    let defaults = Config::default();

    for (name, default_app) in &defaults.apps {
        match user_config.apps.get_mut(name) {
            Some(app) => {
                if app.match_pattern.is_none() {
                    app.match_pattern = default_app.match_pattern.clone();
                }
                if app.replace_template.is_none() {
                    app.replace_template = default_app.replace_template.clone();
                }
            }
            None => {
                user_config.apps.insert(*name, default_app.clone());
            }
        }
    }

    user_config
}

/// Read config from disk and merge with defaults.
pub fn read_config_from_disk() -> Config {
    migrate_legacy_config();
    let path = config_path();
    let user_config = match fs::read_to_string(&path) {
        Ok(content) => match serde_json::from_str(&content) {
            Ok(config) => config,
            Err(e) => {
                log::warn!("Failed to parse config, using defaults: {e}");
                Config::default()
            }
        },
        Err(_) => Config::default(),
    };

    merge_with_defaults(user_config)
}

/// Write config to disk.
pub fn write_config_to_disk(config: &Config) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {e}"))?;
    }
    let json =
        serde_json::to_string_pretty(config).map_err(|e| format!("Failed to serialize: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write config: {e}"))?;
    Ok(())
}

/// Ensure the config file exists on disk (creates with defaults on first launch).
pub fn ensure_config_exists() {
    let path = config_path();
    if !path.exists() {
        let _ = write_config_to_disk(&Config::default());
    }
}

/// Expand tilde in config_path before backend filesystem operations.
///
/// themes_path is deliberately NOT expanded here: it feeds the {themesPath}
/// template var, whose rendered line lands in the user's OWN config files
/// (tmux.conf `source-file ~/...`), which are often dotfiles synced across
/// machines — an expanded absolute home prefix would break them elsewhere.
/// Consumers handle `~` themselves (tmux expands it; file_ops expand on
/// read). Apps that cannot consume a `~` path at all (ghostty rejects it:
/// "cannot include path separators unless it is an absolute path") are
/// placed via managed symlinks instead — see themes::symlinks.
pub fn expand_app_paths(config: &mut Config) {
    for app_config in config.apps.values_mut() {
        app_config.config_path = shellexpand::tilde(&app_config.config_path).to_string();
    }
}

/// Re-tilde absolute paths so they are stored portably on disk.
pub fn collapse_app_paths(config: &mut Config) {
    if let Some(home) = dirs::home_dir() {
        let home_prefix = format!("{}/", home.to_string_lossy());
        for app_config in config.apps.values_mut() {
            if app_config.config_path.starts_with(&home_prefix) {
                app_config.config_path =
                    format!("~/{}", &app_config.config_path[home_prefix.len()..]);
            }
            if let Some(ref tp) = app_config.themes_path {
                if tp.starts_with(&home_prefix) {
                    app_config.themes_path = Some(format!("~/{}", &tp[home_prefix.len()..]));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expand_covers_config_path_but_keeps_themes_path_portable() {
        let mut config = Config::default();
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(tmux.config_path.starts_with("~/"));
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));

        expand_app_paths(&mut config);
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(!tmux.config_path.contains('~'));
        // {themesPath} lands verbatim in dotfile-synced configs — it must
        // stay `~`-portable. See the expand_app_paths doc comment.
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));

        collapse_app_paths(&mut config);
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(tmux.config_path.starts_with("~/"));
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));
    }
}
