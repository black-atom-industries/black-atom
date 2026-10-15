use serde::Serialize;
use specta::Type;

use std::collections::BTreeMap;

use crate::config::types::{AppName, Config};
use crate::themes::registry::config_folder_marker;

/// One adapter's detection outcome — backs the settings AUTO-DETECT action.
#[derive(Debug, Serialize, Type)]
pub struct AppDetection {
    pub app: AppName,
    /// The expanded path that was checked (empty = nothing to check).
    pub config_path: String,
    /// Configured and discovered config folders, for apps configured by config folders.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_folders: Option<Vec<String>>,
    pub found: bool,
}

pub async fn detect_apps() -> Vec<AppDetection> {
    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    let discovered = AppName::all()
        .iter()
        .map(|app| (*app, crate::config::io::discovered_config_folders(*app)))
        .collect();
    detect_apps_inner(&config, &discovered)
}

/// Apps with a config folder marker are configured by config folders rather than a single
/// config file.
fn detect_apps_inner(
    config: &Config,
    discovered_folders: &BTreeMap<AppName, Vec<String>>,
) -> Vec<AppDetection> {
    AppName::all()
        .iter()
        .filter_map(|app| {
            let app_config = config.apps.get(app)?;
            let config_path = app_config.config_path.clone().unwrap_or_default();
            let (config_folders, found) = match config_folder_marker(*app) {
                Some(marker) => {
                    let mut folders =
                        crate::config::io::configured_config_folders(*app, app_config);
                    folders.extend(discovered_folders.get(app).into_iter().flatten().cloned());
                    let folders = crate::config::io::configured_config_folders(
                        *app,
                        &crate::config::types::AppConfig {
                            config_folders: Some(folders),
                            ..app_config.clone()
                        },
                    );
                    let found = folders.iter().any(|folder| {
                        std::path::PathBuf::from(shellexpand::tilde(folder).to_string())
                            .join(marker)
                            .is_file()
                    });
                    (Some(folders), found)
                }
                None => (
                    None,
                    !config_path.is_empty() && std::path::Path::new(&config_path).is_file(),
                ),
            };
            Some(AppDetection {
                app: *app,
                config_path,
                config_folders,
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
                AppName::Ghostty => Some(ghostty_config.to_string_lossy().to_string()),
                AppName::Obsidian => None,
                _ => Some(root.path().join(app.as_str()).to_string_lossy().to_string()),
            };
        }

        let detections = detect_apps_inner(&config, &BTreeMap::new());
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
    fn test_obsidian_detection_uses_configured_config_folders() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();
        std::fs::write(root.path().join("appearance.json"), "{}\n").unwrap();
        let mut config = Config::default();
        let obsidian = config.apps.get_mut(&AppName::Obsidian).unwrap();
        obsidian.config_path = None;
        obsidian.config_folders = Some(vec![root.path().to_string_lossy().into_owned()]);

        let detection = detect_apps_inner(&config, &BTreeMap::new())
            .into_iter()
            .find(|detection| detection.app == AppName::Obsidian)
            .unwrap();
        assert!(detection.found);
        assert!(detection.config_path.is_empty());
        assert_eq!(
            detection.config_folders,
            Some(vec![root.path().to_string_lossy().into_owned()])
        );
    }

    #[test]
    fn test_directory_at_config_path_is_not_found() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();

        let mut config = Config::default();
        for app_config in config.apps.values_mut() {
            app_config.config_path = Some(root.path().to_string_lossy().to_string());
        }

        assert!(detect_apps_inner(&config, &BTreeMap::new())
            .iter()
            .all(|d| !d.found));
    }
}
