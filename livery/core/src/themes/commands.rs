use serde::Serialize;
use specta::Type;

use crate::config::types::AppName;
use crate::updaters::UpdateStatus;

use super::{registry, symlinks};

/// One adapter's setup state: which class it belongs to, which config fields
/// its updater reads, and whether its Linked placement is wired on disk.
#[derive(Debug, Serialize, Type)]
pub struct AppStatus {
    pub app: AppName,
    /// Who consumes the managed theme files — drives the class-specific
    /// settings row content and the SET UP chain.
    pub provisioning: registry::ThemeProvisioning,
    /// Config fields this adapter's updater actually reads — trims the
    /// settings field grid to what's safe to edit.
    pub editable_fields: Vec<registry::AdapterEditableField>,
    /// The adapter's placement resolves to the managed themes dir right now.
    /// Always `false` for External and Merged adapters, which have no
    /// placement to wire.
    pub linked: bool,
}

/// `linked` is read off the unpacked tree, so an adapter reports as unlinked
/// whenever the files are missing. Unpacking first makes the answer truthful
/// even when startup never got that far.
pub async fn get_app_status() -> Result<Vec<AppStatus>, String> {
    super::unpack::ensure_unpacked()?;

    Ok(AppName::all()
        .iter()
        .map(|app| AppStatus {
            app: *app,
            provisioning: registry::provisioning(*app),
            editable_fields: registry::editable_fields(*app),
            linked: is_linked(*app),
        })
        .collect())
}

/// Does this adapter's placement currently point into the managed themes
/// dir? Reads the filesystem, never writes.
fn is_linked(app: AppName) -> bool {
    let Some(placement) = registry::linked_placement(app) else {
        return false;
    };
    let managed_dir = crate::paths::themes_root().join(app.as_str());
    if !managed_dir.is_dir() {
        return false;
    }
    match placement {
        registry::LinkedPlacement::PackDir => symlinks::pack_dir_link_is_wired(&managed_dir),
        registry::LinkedPlacement::FlatByExtension(extension) => {
            let Some(dir) = configured_themes_dir(app) else {
                return false;
            };
            symlinks::has_managed_links(&dir, &managed_dir, extension)
        }
        registry::LinkedPlacement::ConfigFolderThemeDir => configured_themes_dirs(app)
            .map(|dirs| {
                !dirs.is_empty()
                    && dirs
                        .iter()
                        .all(|dir| symlinks::config_folder_pair_is_wired(dir, &managed_dir))
            })
            .unwrap_or(false),
    }
}

/// The adapter's own themes directory as its config points at it today.
fn configured_themes_dirs(app: AppName) -> Option<Vec<std::path::PathBuf>> {
    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    let app_config = config.apps.get(&app)?;
    if app == AppName::Obsidian {
        let folders = crate::config::io::configured_config_folders(app_config);
        return Some(
            folders
                .iter()
                .map(|folder| {
                    std::path::PathBuf::from(shellexpand::tilde(folder).to_string()).join("themes")
                })
                .collect(),
        );
    }
    Some(vec![app_themes_dir(
        app_config.config_path.as_deref()?,
        app_config.themes_path.as_deref(),
    )?])
}

fn configured_themes_dir(app: AppName) -> Option<std::path::PathBuf> {
    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    let app_config = config.apps.get(&app)?;
    app_themes_dir(
        app_config.config_path.as_deref()?,
        app_config.themes_path.as_deref(),
    )
}

/// Outcome of wiring one adapter's themes dir via managed symlinks.
#[derive(Debug, Serialize, Type)]
pub struct LinkThemesResult {
    pub app: String,
    pub status: UpdateStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_folders: Option<Vec<ConfigFolderLinkOutcome>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    pub linked: Option<u32>,
    pub pruned: Option<u32>,
}

#[derive(Debug, Serialize, Type)]
pub struct ConfigFolderLinkOutcome {
    pub config_folder: String,
    pub status: UpdateStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    pub linked: u32,
    pub pruned: u32,
}

pub async fn link_app_themes(app: AppName) -> LinkThemesResult {
    let app_str = app.as_str();

    // The symlinks point into the unpacked tree, so it has to be there
    // before anything is wired.
    if let Err(message) = super::unpack::ensure_unpacked() {
        return LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Error,
            config_folders: None,
            message: Some(message),
            linked: None,
            pruned: None,
        };
    }

    let Some(placement) = registry::linked_placement(app) else {
        return LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Skipped,
            config_folders: None,
            message: Some(format!("{app_str} is not wired via linked themes")),
            linked: None,
            pruned: None,
        };
    };

    if app == AppName::Obsidian {
        return link_obsidian_config_folders(app_str);
    }

    match link_app_themes_inner(app, placement) {
        Ok(stats) => LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Done,
            config_folders: None,
            message: (!stats.skipped.is_empty()).then(|| {
                format!(
                    "left {} real file(s) untouched: {}",
                    stats.skipped.len(),
                    stats.skipped.join(", ")
                )
            }),
            linked: Some(stats.linked),
            pruned: Some(stats.pruned),
        },
        Err(msg) => LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Error,
            config_folders: None,
            message: Some(msg),
            linked: None,
            pruned: None,
        },
    }
}

#[cfg(unix)]
fn link_app_themes_inner(
    app: AppName,
    placement: registry::LinkedPlacement,
) -> Result<symlinks::SymlinkSyncStats, String> {
    let root = crate::paths::themes_root();
    let managed_dir = root.join(app.as_str());
    if !managed_dir.is_dir() {
        return Err(format!(
            "No managed themes for {} — the themes directory is missing",
            app.as_str()
        ));
    }

    // The packpath entry is a fixed XDG location, not derived from the app's
    // own config file.
    if placement == registry::LinkedPlacement::PackDir {
        return symlinks::sync_pack_dir_link(&managed_dir);
    }

    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    let app_config = config
        .apps
        .get(&app)
        .ok_or_else(|| format!("{} not found in config", app.as_str()))?;
    let config_path = app_config
        .config_path
        .as_deref()
        .ok_or_else(|| "Missing config_path".to_string())?;
    let themes_dir =
        app_themes_dir(config_path, app_config.themes_path.as_deref()).ok_or_else(|| {
            format!(
                "Cannot derive a themes directory from config_path '{}'",
                config_path
            )
        })?;

    match placement {
        registry::LinkedPlacement::FlatByExtension(extension) => {
            symlinks::sync_flat_symlinks(&managed_dir, &themes_dir, extension)
        }
        registry::LinkedPlacement::ConfigFolderThemeDir => {
            symlinks::sync_config_folder_theme_links(&managed_dir, &themes_dir)
        }
        registry::LinkedPlacement::PackDir => unreachable!("handled above"),
    }
}

#[cfg(not(unix))]
fn link_app_themes_inner(
    _app: AppName,
    _placement: registry::LinkedPlacement,
) -> Result<symlinks::SymlinkSyncStats, String> {
    Err("Linked theme placement requires a unix filesystem".to_string())
}

fn link_obsidian_config_folders(app_str: &str) -> LinkThemesResult {
    let mut config = crate::config::io::read_config_from_disk();
    crate::config::io::expand_app_paths(&mut config);
    let Some(app_config) = config.apps.get(&AppName::Obsidian) else {
        return LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Error,
            config_folders: Some(Vec::new()),
            message: Some("obsidian not found in config".to_string()),
            linked: None,
            pruned: None,
        };
    };
    let folders = crate::config::io::configured_config_folders(app_config);
    if folders.is_empty() {
        return LinkThemesResult {
            app: app_str.to_string(),
            status: UpdateStatus::Error,
            config_folders: Some(Vec::new()),
            message: Some("No Obsidian config folders configured".to_string()),
            linked: Some(0),
            pruned: Some(0),
        };
    }

    let managed_dir = crate::paths::themes_root().join(app_str);
    let mut config_folders = Vec::with_capacity(folders.len());
    for folder in &folders {
        let config_folder = std::path::PathBuf::from(shellexpand::tilde(folder).to_string());
        if !config_folder.is_dir() {
            config_folders.push(ConfigFolderLinkOutcome {
                config_folder: folder.clone(),
                status: UpdateStatus::Error,
                message: Some("Config folder not found".to_string()),
                linked: 0,
                pruned: 0,
            });
            continue;
        }
        let themes_dir = config_folder.join("themes");
        match symlinks::sync_config_folder_theme_links(&managed_dir, &themes_dir) {
            Ok(stats) => config_folders.push(ConfigFolderLinkOutcome {
                config_folder: folder.clone(),
                status: UpdateStatus::Done,
                message: (!stats.skipped.is_empty())
                    .then(|| format!("left {} real file(s) untouched", stats.skipped.len())),
                linked: stats.linked,
                pruned: stats.pruned,
            }),
            Err(error) => config_folders.push(ConfigFolderLinkOutcome {
                config_folder: folder.clone(),
                status: UpdateStatus::Error,
                message: Some(error),
                linked: 0,
                pruned: 0,
            }),
        }
    }
    let failed = config_folders
        .iter()
        .filter(|config_folder| config_folder.status == UpdateStatus::Error)
        .count();
    let linked = config_folders
        .iter()
        .map(|config_folder| config_folder.linked)
        .sum();
    let pruned = config_folders
        .iter()
        .map(|config_folder| config_folder.pruned)
        .sum();
    LinkThemesResult {
        app: app_str.to_string(),
        status: if failed > 0 {
            UpdateStatus::Error
        } else {
            UpdateStatus::Done
        },
        config_folders: Some(config_folders),
        message: (failed > 0).then(|| format!("{failed} Obsidian config folder(s) failed")),
        linked: Some(linked),
        pruned: Some(pruned),
    }
}

/// Use an explicitly configured themes directory when present. Adapters without
/// one use the sibling `themes/` directory of their config file.
fn app_themes_dir(config_path: &str, configured_path: Option<&str>) -> Option<std::path::PathBuf> {
    if let Some(path) = configured_path.filter(|path| !path.is_empty()) {
        return Some(std::path::PathBuf::from(
            shellexpand::tilde(path).to_string(),
        ));
    }

    let path = std::path::Path::new(config_path);
    Some(path.parent()?.join("themes"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_themes_dir_derives_from_config_path_sibling() {
        assert_eq!(
            app_themes_dir("/Users/x/.config/zed/settings.json", None),
            Some(std::path::PathBuf::from("/Users/x/.config/zed/themes"))
        );
        assert_eq!(
            app_themes_dir("/Users/x/.config/zed-custom/settings.json", None),
            Some(std::path::PathBuf::from(
                "/Users/x/.config/zed-custom/themes"
            ))
        );
        assert_eq!(
            app_themes_dir(
                "/Users/x/.config/tmux/tmux.conf",
                Some("~/.config/tmux/themes")
            ),
            Some(dirs::home_dir().unwrap().join(".config/tmux/themes"))
        );
    }
}
