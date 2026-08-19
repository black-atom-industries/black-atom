use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use super::types::{AppConfig, AppName, Config};

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
    match copy_atomic(&legacy, &target) {
        Ok(()) => log::info!(
            "Migrated livery config from {} to {}",
            legacy.display(),
            target.display()
        ),
        Err(e) => log::warn!("Failed to migrate the livery config: {e}"),
    }
}

/// Copy `source` onto `target` through a temp file in the same directory, so
/// a reader never observes a half-written config. The name is unpredictable
/// and created exclusively, so nothing can be squatting on it; the temp file
/// is removed on any failure.
fn copy_atomic(source: &Path, target: &Path) -> std::io::Result<()> {
    let parent = target.parent().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            format!("{} has no parent directory", target.display()),
        )
    })?;

    let bytes = fs::read(source)?;
    let mut tmp = tempfile::NamedTempFile::new_in(parent)?;
    tmp.write_all(&bytes)?;
    tmp.persist(target).map_err(|e| e.error)?;
    Ok(())
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
                if app.settings_path.is_none() {
                    app.settings_path = default_app.settings_path.clone();
                }
                if app.settings.is_none() {
                    app.settings = default_app.settings.clone();
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
        Ok(content) => match serde_json::from_str::<Config>(&content) {
            Ok(mut config) => {
                normalize_config(&mut config, &path);
                config
            }
            Err(e) => {
                log::warn!("Failed to parse config, using defaults: {e}");
                Config::default()
            }
        },
        Err(_) => Config::default(),
    };

    merge_with_defaults(user_config)
}

/// Return the platform-specific Obsidian global vault registry.
fn obsidian_registry_path() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        return dirs::home_dir().map(|home| {
            home.join("Library")
                .join("Application Support")
                .join("obsidian")
                .join("obsidian.json")
        });
    }
    #[cfg(target_os = "linux")]
    {
        return dirs::config_dir().map(|config| config.join("obsidian/obsidian.json"));
    }
    #[cfg(target_os = "windows")]
    {
        return dirs::config_dir().map(|config| config.join("Obsidian/obsidian.json"));
    }
    #[allow(unreachable_code)]
    None
}

/// Read vault paths from an Obsidian registry and map them to the default
/// `.obsidian` configuration folder. Invalid entries and missing vaults are
/// ignored so one stale registry entry cannot block setup.
pub fn obsidian_config_folders_from_registry(path: &Path) -> Vec<String> {
    let Ok(content) = fs::read_to_string(path) else {
        return Vec::new();
    };
    let Ok(registry) = serde_json::from_str::<serde_json::Value>(&content) else {
        return Vec::new();
    };
    let Some(vaults) = registry
        .get("vaults")
        .and_then(serde_json::Value::as_object)
    else {
        return Vec::new();
    };

    normalize_config_folders(vaults.values().filter_map(|vault| {
        let path = vault.get("path")?.as_str()?;
        let path = PathBuf::from(shellexpand::tilde(path).to_string());
        if path.as_os_str().is_empty() || !path.is_absolute() || !path.is_dir() {
            return None;
        }
        Some(path.join(".obsidian").to_string_lossy().into_owned())
    }))
}

/// Discover default Obsidian configuration folders from the platform registry.
pub fn discovered_obsidian_config_folders() -> Vec<String> {
    obsidian_registry_path()
        .as_deref()
        .map(obsidian_config_folders_from_registry)
        .unwrap_or_default()
}

/// Return configured Obsidian configuration folders in their normalized,
/// portable form. Filesystem consumers expand each returned identity at the
/// point where they access a file.
pub fn configured_config_folders(app_config: &AppConfig) -> Vec<String> {
    if let Some(folders) = app_config.config_folders.as_ref() {
        return normalize_config_folders(folders.iter().cloned());
    }

    let Some(config_path) = app_config.config_path.as_deref() else {
        return Vec::new();
    };
    let expanded_path = PathBuf::from(shellexpand::tilde(config_path).to_string());
    if expanded_path.file_name().and_then(|name| name.to_str()) != Some("appearance.json") {
        return Vec::new();
    }
    Path::new(config_path)
        .parent()
        .map(|folder| normalize_config_folders([folder.to_string_lossy().into_owned()]))
        .unwrap_or_default()
}

fn config_folder_identity(folder: &str) -> String {
    shellexpand::tilde(&normalize_config_folder(folder)).to_string()
}

fn normalize_config_folders<I>(folders: I) -> Vec<String>
where
    I: IntoIterator<Item = String>,
{
    let mut identities = std::collections::HashSet::new();
    folders
        .into_iter()
        .map(|folder| normalize_config_folder(&folder))
        .filter(|folder| identities.insert(config_folder_identity(folder)))
        .collect()
}

fn normalize_config_folder(folder: &str) -> String {
    let portable = folder == "~" || folder.starts_with("~/");
    let expanded = shellexpand::tilde(folder).to_string();
    let mut normalized = PathBuf::new();
    for component in Path::new(&expanded).components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            _ => normalized.push(component.as_os_str()),
        }
    }
    let normalized = normalized.to_string_lossy().into_owned();
    if portable {
        if let Some(home) = dirs::home_dir() {
            let home_string = home.to_string_lossy();
            let prefix = format!("{home_string}/");
            if normalized == home_string {
                return "~".to_string();
            }
            if normalized.starts_with(&prefix) {
                return format!("~/{}", &normalized[prefix.len()..]);
            }
        }
    }
    normalized
}

/// Normalize legacy Obsidian fields and persist the new schema before callers
/// receive the config. The change is written only when the in-memory schema
/// actually changes, so a second read is a no-op.
fn normalize_config(config: &mut Config, path: &Path) {
    let legacy_schema = config.version < 2;
    let mut changed = false;
    if legacy_schema {
        config.version = 2;
        changed = true;
    }

    if let Some(obsidian) = config.apps.get_mut(&AppName::Obsidian) {
        let had_folders = obsidian.config_folders.is_some();
        let original_folders = obsidian.config_folders.take().unwrap_or_default();
        let mut folders = original_folders.clone();
        let legacy_path = std::mem::take(&mut obsidian.config_path);
        if let Some(legacy_path) = legacy_path {
            let legacy = PathBuf::from(shellexpand::tilde(&legacy_path).to_string());
            if legacy.file_name().and_then(|name| name.to_str()) == Some("appearance.json") {
                if let Some(folder) = legacy.parent() {
                    folders.push(folder.to_string_lossy().into_owned());
                }
            } else {
                log::warn!("Cannot migrate Obsidian config_path '{legacy_path}'; expected a config folder's appearance.json");
            }
            changed = true;
        }
        folders = normalize_config_folders(folders);
        changed |= !had_folders || folders != original_folders;
        obsidian.config_folders = Some(folders);
    }

    if changed {
        collapse_app_paths(config);
        if let Err(error) = write_config_atomic(path, config) {
            log::warn!("Failed to persist config schema migration: {error}");
        }
    }
}

/// Write config to disk.
pub fn write_config_to_disk(config: &Config) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {e}"))?;
    }
    write_config_atomic(&path, config).map_err(|e| format!("Failed to write config: {e}"))
}

fn write_config_atomic(path: &Path, config: &Config) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| std::io::Error::other(format!("Failed to serialize: {e}")))?;
    let parent = path.parent().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "config path has no parent",
        )
    })?;
    let mut tmp = tempfile::NamedTempFile::new_in(parent)?;
    tmp.write_all(json.as_bytes())?;
    tmp.persist(path).map_err(|error| error.error)?;
    Ok(())
}

/// Ensure the config file exists on disk (creates with defaults on first launch).
pub fn ensure_config_exists() {
    let path = config_path();
    if !path.exists() {
        let _ = write_config_to_disk(&Config::default());
    }
}

/// Expand tilde in config_path before backend filesystem operations. Obsidian
/// config-folder identities stay portable; their filesystem consumers expand
/// them locally so results can retain the stored identity.
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
        if let Some(config_path) = app_config.config_path.as_mut() {
            *config_path = shellexpand::tilde(config_path).to_string();
        }
    }
}

/// Re-tilde absolute paths so they are stored portably on disk.
pub fn collapse_app_paths(config: &mut Config) {
    if let Some(home) = dirs::home_dir() {
        let home_prefix = format!("{}/", home.to_string_lossy());
        for app_config in config.apps.values_mut() {
            if let Some(config_path) = app_config.config_path.as_mut() {
                if config_path.starts_with(&home_prefix) {
                    *config_path = format!("~/{}", &config_path[home_prefix.len()..]);
                }
            }
            if let Some(ref tp) = app_config.themes_path {
                if tp.starts_with(&home_prefix) {
                    app_config.themes_path = Some(format!("~/{}", &tp[home_prefix.len()..]));
                }
            }
            if let Some(folders) = app_config.config_folders.as_mut() {
                *folders = normalize_config_folders(std::mem::take(folders));
            }
        }
    }
    if let Some(obsidian) = config.apps.get_mut(&AppName::Obsidian) {
        if let Some(legacy_path) = obsidian.config_path.take() {
            let legacy = PathBuf::from(shellexpand::tilde(&legacy_path).to_string());
            if legacy.file_name().and_then(|name| name.to_str()) == Some("appearance.json") {
                if let Some(folder) = legacy.parent() {
                    let folders = obsidian.config_folders.get_or_insert_with(Vec::new);
                    folders.push(folder.to_string_lossy().into_owned());
                }
            }
        }
        if let Some(folders) = obsidian.config_folders.as_mut() {
            *folders = normalize_config_folders(std::mem::take(folders));
        }
        obsidian.config_path = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn copy_atomic_reproduces_the_source_and_leaves_no_tmp() {
        let dir = tempfile::TempDir::new().unwrap();
        let source = dir.path().join("legacy.json");
        let target = dir.path().join("config.json");
        let content = b"{\n  \"apps\": {}\n}\n";
        fs::write(&source, content).unwrap();

        copy_atomic(&source, &target).unwrap();

        assert_eq!(fs::read(&target).unwrap(), content);
        let leftovers: Vec<String> = fs::read_dir(dir.path())
            .unwrap()
            .flatten()
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".tmp"))
            .collect();
        assert!(leftovers.is_empty(), "tmp files left behind: {leftovers:?}");
    }

    #[test]
    fn copy_atomic_removes_its_tmp_when_the_rename_fails() {
        let dir = tempfile::TempDir::new().unwrap();
        let source = dir.path().join("legacy.json");
        fs::write(&source, b"{}").unwrap();
        // A target whose own name is an existing directory: the copy
        // succeeds, the rename cannot.
        let target = dir.path().join("config.json");
        fs::create_dir(&target).unwrap();

        assert!(copy_atomic(&source, &target).is_err());

        let leftovers: Vec<String> = fs::read_dir(dir.path())
            .unwrap()
            .flatten()
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".tmp"))
            .collect();
        assert!(leftovers.is_empty(), "tmp files left behind: {leftovers:?}");
    }

    #[test]
    fn copy_atomic_never_follows_a_symlink_squatting_on_its_tmp_name() {
        let dir = tempfile::TempDir::new().unwrap();
        let source = dir.path().join("legacy.json");
        let target = dir.path().join("config.json");
        fs::write(&source, b"{\"migrated\":true}").unwrap();

        let decoy = dir.path().join("decoy.json");
        fs::write(&decoy, b"do not clobber me").unwrap();
        let squat = dir.path().join("config.json.tmp");
        std::os::unix::fs::symlink(&decoy, &squat).unwrap();

        copy_atomic(&source, &target).unwrap();

        assert_eq!(fs::read(&decoy).unwrap(), b"do not clobber me");
        assert_eq!(fs::read(&target).unwrap(), b"{\"migrated\":true}");
        assert!(
            fs::symlink_metadata(&squat)
                .unwrap()
                .file_type()
                .is_symlink(),
            "the squatting symlink must be left alone"
        );
    }

    #[test]
    fn merge_backfills_nvim_settings_for_a_config_written_before_they_existed() {
        let mut config = Config::default();
        let nvim = config
            .apps
            .get_mut(&crate::config::types::AppName::Nvim)
            .unwrap();
        nvim.settings = None;
        nvim.settings_path = None;

        let merged = merge_with_defaults(config);
        let nvim = merged
            .apps
            .get(&crate::config::types::AppName::Nvim)
            .unwrap();

        assert_eq!(
            nvim.settings_path.as_deref(),
            Some(crate::config::types::NVIM_SETTINGS_PATH)
        );
        assert_eq!(
            nvim.settings,
            Some(crate::config::types::NvimSettings::default())
        );
    }

    #[test]
    fn v1_obsidian_config_migrates_to_a_v2_config_folder_atomically() {
        let dir = tempfile::TempDir::new().unwrap();
        let appearance = dir.path().join("notes/.obsidian-mobile/appearance.json");
        fs::create_dir_all(appearance.parent().unwrap()).unwrap();
        let mut config = Config::default();
        let obsidian = config.apps.get_mut(&AppName::Obsidian).unwrap();
        obsidian.config_path = Some(appearance.to_string_lossy().into_owned());
        config.version = 1;
        let path = dir.path().join("config.json");
        normalize_config(&mut config, &path);
        normalize_config(&mut config, &path);
        let migrated: Config = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
        let obsidian = &migrated.apps[&AppName::Obsidian];
        assert_eq!(migrated.version, 2);
        assert!(obsidian.config_path.is_none());
        assert_eq!(
            obsidian.config_folders.as_ref().unwrap(),
            &[appearance.parent().unwrap().to_string_lossy().to_string()]
        );
    }

    #[test]
    fn mixed_v1_v2_obsidian_entries_are_preserved() {
        let dir = tempfile::TempDir::new().unwrap();
        let appearance = dir.path().join("notes/.obsidian/appearance.json");
        let existing = dir.path().join("work/.obsidian-mobile");
        let mut config = Config::default();
        let obsidian = config.apps.get_mut(&AppName::Obsidian).unwrap();
        obsidian.config_path = Some(appearance.to_string_lossy().into_owned());
        obsidian.config_folders = Some(vec![existing.to_string_lossy().into_owned()]);
        let path = dir.path().join("config.json");

        normalize_config(&mut config, &path);

        let folders = config.apps[&AppName::Obsidian]
            .config_folders
            .as_ref()
            .unwrap();
        assert_eq!(
            folders,
            &[
                existing.to_string_lossy().to_string(),
                appearance.parent().unwrap().to_string_lossy().to_string()
            ]
        );
        let json = fs::read_to_string(path).unwrap();
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(value["apps"]["obsidian"].get("config_path").is_none());
    }

    #[test]
    fn obsidian_registry_returns_default_folders_and_ignores_bad_entries() {
        let dir = tempfile::TempDir::new().unwrap();
        let valid = dir.path().join("valid-vault");
        fs::create_dir(&valid).unwrap();
        let registry = dir.path().join("obsidian.json");
        let json = serde_json::json!({
            "vaults": {
                "valid": { "path": valid },
                "missing": { "path": dir.path().join("missing-vault") },
                "empty": { "path": "" },
                "malformed": { "path": 42 }
            }
        });
        fs::write(&registry, serde_json::to_vec(&json).unwrap()).unwrap();

        assert_eq!(
            obsidian_config_folders_from_registry(&registry),
            vec![valid.join(".obsidian").to_string_lossy().into_owned()]
        );
    }

    #[test]
    fn configured_folders_deduplicate_tilde_absolute_and_dot_spellings() {
        let home = dirs::home_dir().unwrap();
        let absolute = home.join("Notes/.obsidian");
        let config = AppConfig {
            enabled: true,
            config_path: None,
            config_folders: Some(vec![
                "~/Notes/./.obsidian".to_string(),
                absolute.to_string_lossy().into_owned(),
                "~/Notes/.obsidian".to_string(),
            ]),
            themes_path: None,
            match_pattern: None,
            replace_template: None,
            settings_path: None,
            settings: None,
        };

        assert_eq!(
            configured_config_folders(&config),
            vec!["~/Notes/.obsidian"]
        );
    }

    #[test]
    fn v2_config_round_trips_default_and_renamed_config_folders() {
        let mut config = Config::default();
        config
            .apps
            .get_mut(&AppName::Obsidian)
            .unwrap()
            .config_folders = Some(vec![
            "~/Notes/.obsidian".to_string(),
            "~/Work/.obsidian-mobile".to_string(),
        ]);
        let json = serde_json::to_string(&config).unwrap();
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(value["apps"]["obsidian"].get("config_path").is_none());
        let restored: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.version, 2);
        assert_eq!(
            restored.apps[&AppName::Obsidian].config_folders.as_deref(),
            Some(
                [
                    "~/Notes/.obsidian".to_string(),
                    "~/Work/.obsidian-mobile".to_string()
                ]
                .as_slice()
            )
        );
    }

    #[test]
    fn collapse_migrates_legacy_obsidian_path_and_normalizes_folder_identity() {
        let home = dirs::home_dir().unwrap();
        let mut config = Config::default();
        let obsidian = config.apps.get_mut(&AppName::Obsidian).unwrap();
        obsidian.config_path = Some(
            home.join("Notes/.obsidian/appearance.json")
                .to_string_lossy()
                .into_owned(),
        );
        obsidian.config_folders = Some(vec!["~/Notes/./.obsidian".to_string()]);

        collapse_app_paths(&mut config);

        let obsidian = &config.apps[&AppName::Obsidian];
        assert!(obsidian.config_path.is_none());
        assert_eq!(
            obsidian.config_folders.as_ref().unwrap(),
            &["~/Notes/.obsidian"]
        );
        let json = serde_json::to_value(&config).unwrap();
        assert!(json["apps"]["obsidian"].get("config_path").is_none());
    }

    #[test]
    fn test_expand_covers_config_path_but_keeps_themes_path_portable() {
        let mut config = Config::default();
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(tmux.config_path.as_deref().unwrap().starts_with("~/"));
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));

        expand_app_paths(&mut config);
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(!tmux.config_path.as_deref().unwrap().contains('~'));
        // {themesPath} lands verbatim in dotfile-synced configs — it must
        // stay `~`-portable. See the expand_app_paths doc comment.
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));

        collapse_app_paths(&mut config);
        let tmux = config
            .apps
            .get(&crate::config::types::AppName::Tmux)
            .unwrap();
        assert!(tmux.config_path.as_deref().unwrap().starts_with("~/"));
        assert!(tmux.themes_path.as_deref().unwrap().starts_with("~/"));
    }
}
