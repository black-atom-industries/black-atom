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
    let neovim_installed = neovim_installed_in(
        &crate::paths::config_home(),
        std::env::var_os("PATH").as_deref(),
    );
    detect_apps_inner(&config, &discovered, neovim_installed)
}

/// Neovim needs no config file to take a theme, so a machine has it when its
/// config directory exists or the binary is on PATH.
fn neovim_installed_in(config_home: &std::path::Path, path: Option<&std::ffi::OsStr>) -> bool {
    config_home.join("nvim").is_dir()
        || path
            .is_some_and(|path| std::env::split_paths(path).any(|dir| dir.join("nvim").is_file()))
}

/// Apps with a config folder marker are configured by config folders rather than a single
/// config file.
fn detect_apps_inner(
    config: &Config,
    discovered_folders: &BTreeMap<AppName, Vec<String>>,
    neovim_installed: bool,
) -> Vec<AppDetection> {
    AppName::all()
        .iter()
        .filter_map(|app| {
            let app_config = config.apps.get(app)?;
            let config_path = if *app == AppName::Nvim {
                String::new()
            } else {
                app_config.config_path.clone().unwrap_or_default()
            };
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
                None if *app == AppName::Nvim => (None, neovim_installed),
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

        let detections = detect_apps_inner(&config, &BTreeMap::new(), false);
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

        let detection = detect_apps_inner(&config, &BTreeMap::new(), false)
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
    fn test_neovim_is_found_by_config_dir_or_binary() {
        let root = tempfile::TempDir::new().unwrap();
        let config_home = root.path().join("config");
        let bin = root.path().join("bin");
        std::fs::create_dir_all(&config_home).unwrap();
        std::fs::create_dir_all(&bin).unwrap();
        let path = std::env::join_paths([&bin]).unwrap();

        assert!(!neovim_installed_in(&config_home, Some(&path)));
        assert!(!neovim_installed_in(&config_home, None));

        std::fs::write(bin.join("nvim"), "").unwrap();
        assert!(neovim_installed_in(&config_home, Some(&path)));

        std::fs::create_dir(config_home.join("nvim")).unwrap();
        assert!(neovim_installed_in(&config_home, None));
    }

    #[test]
    fn test_neovim_detection_ignores_a_stored_config_path() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();
        let stale = root.path().join("init.lua");
        std::fs::write(&stale, "").unwrap();
        let mut config = Config::default();
        config.apps.get_mut(&AppName::Nvim).unwrap().config_path =
            Some(stale.to_string_lossy().into_owned());

        for installed in [false, true] {
            let nvim = detect_apps_inner(&config, &BTreeMap::new(), installed)
                .into_iter()
                .find(|detection| detection.app == AppName::Nvim)
                .unwrap();
            assert_eq!(nvim.found, installed);
            assert!(nvim.config_path.is_empty());
        }
    }

    #[test]
    fn test_directory_at_config_path_is_not_found() {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();

        let mut config = Config::default();
        for app_config in config.apps.values_mut() {
            app_config.config_path = Some(root.path().to_string_lossy().to_string());
        }

        assert!(detect_apps_inner(&config, &BTreeMap::new(), false)
            .iter()
            .all(|d| !d.found));
    }
}
