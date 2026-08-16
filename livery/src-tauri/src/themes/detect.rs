use serde::Serialize;
use specta::Type;

use crate::config::types::{AppName, Config};

/// One adapter's detection outcome — backs the settings AUTO-DETECT action.
#[derive(Debug, Serialize, Type)]
pub struct AppDetection {
    pub app: AppName,
    /// The expanded path that was checked (empty = nothing to check).
    pub config_path: String,
    pub found: bool,
}

/// Conservative app detection: an app counts as found iff its configured
/// config file exists on disk. No binary lookups, no alternative-path
/// guessing (wizard territory, #35) — better to miss than misconfigure.
#[tauri::command]
#[specta::specta]
pub async fn detect_apps() -> Vec<AppDetection> {
    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    detect_apps_inner(&config)
}

/// An empty config_path (obsidian until a vault is supplied) is never
/// checked against the filesystem — it reads as not found.
fn detect_apps_inner(config: &Config) -> Vec<AppDetection> {
    AppName::all()
        .iter()
        .filter_map(|app| {
            let app_config = config.apps.get(app)?;
            let config_path = app_config.config_path.clone();
            let found = !config_path.is_empty() && std::path::Path::new(&config_path).is_file();
            Some(AppDetection {
                app: *app,
                config_path,
                found,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detects_existing_config_files_only() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();
        let ghostty_config = root.path().join("ghostty/config");
        std::fs::create_dir_all(ghostty_config.parent().unwrap()).unwrap();
        std::fs::write(&ghostty_config, "theme = black-atom-default-dark.conf\n").unwrap();

        let mut config = Config::default();
        for (app, app_config) in config.apps.iter_mut() {
            app_config.config_path = match app {
                AppName::Ghostty => ghostty_config.to_string_lossy().to_string(),
                AppName::Obsidian => String::new(),
                _ => root.path().join(app.as_str()).to_string_lossy().to_string(),
            };
        }

        let detections = detect_apps_inner(&config);
        assert_eq!(detections.len(), AppName::all().len());
        for detection in detections {
            match detection.app {
                AppName::Ghostty => assert!(detection.found, "ghostty config exists"),
                _ => assert!(
                    !detection.found,
                    "{} has no config file on disk",
                    detection.app.as_str()
                ),
            }
        }
    }

    #[test]
    fn test_directory_at_config_path_is_not_found() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();

        let mut config = Config::default();
        for app_config in config.apps.values_mut() {
            app_config.config_path = root.path().to_string_lossy().to_string();
        }

        assert!(detect_apps_inner(&config).iter().all(|d| !d.found));
    }
}
