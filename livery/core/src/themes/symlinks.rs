//! Symlink placement for Linked adapters — apps that read theme files from
//! an app-defined location (zed/ghostty/tmux: flat `themes/` dir next to
//! the config; obsidian: the vault's per-theme subdirectory). Each managed
//! file gets a symlink there pointing into the managed dir. Re-running
//! heals dangling links and prunes managed-owned leftovers; real files a
//! user placed themselves are never touched.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Default, PartialEq, Eq)]
pub struct SymlinkSyncStats {
    pub linked: u32,
    pub pruned: u32,
    /// Names skipped because a real (non-symlink) file already sits there.
    pub skipped: Vec<String>,
}

/// Point `<app_themes_dir>/<file>` at every `black-atom-*<extension>` one
/// collection level below `managed_dir`, then prune managed-owned links
/// whose file no longer exists in the fresh set.
#[cfg(unix)]
pub fn sync_flat_symlinks(
    managed_dir: &Path,
    app_themes_dir: &Path,
    extension: &str,
) -> Result<SymlinkSyncStats, String> {
    std::fs::create_dir_all(app_themes_dir)
        .map_err(|e| format!("Failed to create {}: {e}", app_themes_dir.display()))?;
    ensure_under_home(app_themes_dir)?;
    ensure_under_home(managed_dir)?;

    let fresh = fresh_theme_files(managed_dir, extension)?;
    let mut stats = SymlinkSyncStats::default();

    for (name, target) in &fresh {
        place_link(&app_themes_dir.join(name), target, name, &mut stats)?;
    }

    // Prune: managed-owned links whose theme vanished upstream.
    let entries = std::fs::read_dir(app_themes_dir)
        .map_err(|e| format!("Failed to read {}: {e}", app_themes_dir.display()))?;
    for entry in entries.flatten() {
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if !name.starts_with("black-atom-") || fresh.contains_key(name) {
            continue;
        }
        let path = entry.path();
        let Ok(meta) = std::fs::symlink_metadata(&path) else {
            continue;
        };
        if !meta.file_type().is_symlink() {
            continue;
        }
        let Ok(target) = std::fs::read_link(&path) else {
            continue;
        };
        if target.starts_with(managed_dir) {
            std::fs::remove_file(&path)
                .map_err(|e| format!("Failed to prune {}: {e}", path.display()))?;
            stats.pruned += 1;
        }
    }

    Ok(stats)
}

/// The vault theme folder Obsidian discovers — must match the adapter
/// manifest's `name` field.
pub const OBSIDIAN_THEME_DIR: &str = "Black Atom";

/// Link the managed obsidian `theme.css` + `manifest.json` pair into
/// `<vault_themes_dir>/Black Atom/` — Obsidian discovers themes as
/// per-name subdirectories of the vault's themes dir. Same heal/skip
/// semantics as the flat sync; nothing to prune (fixed two-file set).
#[cfg(unix)]
pub fn sync_vault_theme_links(
    managed_dir: &Path,
    vault_themes_dir: &Path,
) -> Result<SymlinkSyncStats, String> {
    let theme_dir = vault_themes_dir.join(OBSIDIAN_THEME_DIR);
    std::fs::create_dir_all(&theme_dir)
        .map_err(|e| format!("Failed to create {}: {e}", theme_dir.display()))?;
    ensure_under_home(&theme_dir)?;
    ensure_under_home(managed_dir)?;

    let mut stats = SymlinkSyncStats::default();
    for name in ["theme.css", "manifest.json"] {
        let target = managed_dir.join(name);
        if !target.is_file() {
            return Err(format!("Managed {name} is missing — run SYNC THEMES first"));
        }
        place_link(&theme_dir.join(name), &target, name, &mut stats)?;
    }
    Ok(stats)
}

/// Neovim's packpath entry for the unpacked nvim adapter, relative to
/// `data_home()`.
pub const NVIM_PACK_DIR: &str = "nvim/site/pack/black-atom/start/black-atom";

/// Point the packpath entry at the unpacked nvim dir. Neovim adds
/// `pack/*/start/*` to the runtimepath itself, so one directory symlink
/// exposes both `colors/` and the runtime under `lua/`. A real directory
/// already sitting there is someone else's plugin install — left alone.
#[cfg(unix)]
pub fn sync_pack_dir_link(managed_dir: &Path) -> Result<SymlinkSyncStats, String> {
    let link = crate::paths::data_home().join(NVIM_PACK_DIR);
    let parent = link
        .parent()
        .ok_or_else(|| format!("{} has no parent", link.display()))?;
    std::fs::create_dir_all(parent)
        .map_err(|e| format!("Failed to create {}: {e}", parent.display()))?;
    ensure_under_home(parent)?;
    ensure_under_home(managed_dir)?;

    let mut stats = SymlinkSyncStats::default();
    place_link(&link, managed_dir, NVIM_PACK_DIR, &mut stats)?;
    Ok(stats)
}

/// Create or heal one symlink: re-aim symlinks that don't point at the
/// fresh target (heals dangling and clone-farm links), never touch a real
/// file already sitting there.
#[cfg(unix)]
fn place_link(
    link: &Path,
    target: &Path,
    name: &str,
    stats: &mut SymlinkSyncStats,
) -> Result<(), String> {
    match std::fs::symlink_metadata(link) {
        Ok(meta) if meta.file_type().is_symlink() => {
            if std::fs::read_link(link).ok().as_deref() != Some(target) {
                std::fs::remove_file(link)
                    .map_err(|e| format!("Failed to replace {}: {e}", link.display()))?;
                std::os::unix::fs::symlink(target, link)
                    .map_err(|e| format!("Failed to link {}: {e}", link.display()))?;
            }
            stats.linked += 1;
        }
        Ok(_) => {
            stats.skipped.push(name.to_string());
        }
        Err(_) => {
            std::os::unix::fs::symlink(target, link)
                .map_err(|e| format!("Failed to link {}: {e}", link.display()))?;
            stats.linked += 1;
        }
    }
    Ok(())
}

/// Filename → absolute managed path for every theme file one collection
/// level below the managed dir, filtered by extension.
fn fresh_theme_files(
    managed_dir: &Path,
    extension: &str,
) -> Result<HashMap<String, PathBuf>, String> {
    let mut fresh = HashMap::new();
    let collections = std::fs::read_dir(managed_dir)
        .map_err(|e| format!("Failed to read {}: {e}", managed_dir.display()))?;
    for collection in collections.flatten() {
        if !collection.path().is_dir() {
            continue;
        }
        let Ok(files) = std::fs::read_dir(collection.path()) else {
            continue;
        };
        for file in files.flatten() {
            let name = file.file_name();
            let Some(name) = name.to_str() else { continue };
            if name.starts_with("black-atom-") && name.ends_with(extension) {
                fresh.insert(name.to_string(), file.path());
            }
        }
    }
    Ok(fresh)
}

/// Is `link` a symlink resolving to `target`? The read-only counterpart of
/// `place_link` — no directories are created, nothing is healed.
#[cfg(unix)]
fn link_points_at(link: &Path, target: &Path) -> bool {
    std::fs::read_link(link).ok().as_deref() == Some(target)
}

/// Does the app's flat themes dir hold at least one managed link? Anything
/// less means the placement was never run, or was undone.
#[cfg(unix)]
pub fn has_managed_links(app_themes_dir: &Path, managed_dir: &Path, extension: &str) -> bool {
    let Ok(fresh) = fresh_theme_files(managed_dir, extension) else {
        return false;
    };
    fresh
        .iter()
        .any(|(name, target)| link_points_at(&app_themes_dir.join(name), target))
}

/// Is the vault's `Black Atom` theme dir wired to the managed pair?
#[cfg(unix)]
pub fn vault_pair_is_wired(vault_themes_dir: &Path, managed_dir: &Path) -> bool {
    let theme_dir = vault_themes_dir.join(OBSIDIAN_THEME_DIR);
    ["theme.css", "manifest.json"]
        .iter()
        .all(|name| link_points_at(&theme_dir.join(name), &managed_dir.join(name)))
}

/// Does neovim's packpath entry resolve to the unpacked nvim dir?
#[cfg(unix)]
pub fn pack_dir_link_is_wired(managed_dir: &Path) -> bool {
    link_points_at(&crate::paths::data_home().join(NVIM_PACK_DIR), managed_dir)
}

#[cfg(not(unix))]
pub fn has_managed_links(_app_themes_dir: &Path, _managed_dir: &Path, _extension: &str) -> bool {
    false
}

#[cfg(not(unix))]
pub fn vault_pair_is_wired(_vault_themes_dir: &Path, _managed_dir: &Path) -> bool {
    false
}

#[cfg(not(unix))]
pub fn pack_dir_link_is_wired(_managed_dir: &Path) -> bool {
    false
}

/// Same discipline as `file_ops` writers: never touch anything outside the
/// user's home directory.
fn ensure_under_home(path: &Path) -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("Cannot determine home directory")?
        .canonicalize()
        .map_err(|e| format!("Cannot resolve home directory: {e}"))?;
    let resolved = path
        .canonicalize()
        .map_err(|e| format!("Cannot resolve {}: {e}", path.display()))?;
    if !resolved.starts_with(&home) {
        return Err(format!(
            "Refusing to write outside the home directory: {}",
            resolved.display()
        ));
    }
    Ok(())
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    struct Setup {
        _root: tempfile::TempDir,
        managed: PathBuf,
        app_dir: PathBuf,
    }

    fn setup(extension: &str) -> Setup {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let root = tempfile::TempDir::new_in(home).unwrap();
        let managed = root.path().join("managed").join("app");
        let app_dir = root.path().join("app-config").join("themes");
        std::fs::create_dir_all(managed.join("jpn")).unwrap();
        std::fs::write(
            managed
                .join("jpn")
                .join(format!("black-atom-jpn-koyo-yoru{extension}")),
            "content",
        )
        .unwrap();
        Setup {
            _root: root,
            managed,
            app_dir,
        }
    }

    #[test]
    fn test_creates_links_into_managed_dir() {
        let s = setup(".json");
        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();

        assert_eq!(stats.linked, 1);
        let link = s.app_dir.join("black-atom-jpn-koyo-yoru.json");
        let target = std::fs::read_link(&link).unwrap();
        assert!(target.starts_with(&s.managed));
    }

    #[test]
    fn test_extension_filter_scopes_the_sync() {
        // A ghostty-style .conf sync must ignore .json files and vice versa.
        let s = setup(".conf");
        std::fs::write(
            s.managed.join("jpn").join("black-atom-other.json"),
            "not mine",
        )
        .unwrap();

        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".conf").unwrap();

        assert_eq!(stats.linked, 1);
        assert!(s.app_dir.join("black-atom-jpn-koyo-yoru.conf").exists());
        assert!(!s.app_dir.join("black-atom-other.json").exists());
    }

    #[test]
    fn test_heals_dangling_and_foreign_links() {
        let s = setup(".json");
        std::fs::create_dir_all(&s.app_dir).unwrap();
        let link = s.app_dir.join("black-atom-jpn-koyo-yoru.json");
        std::os::unix::fs::symlink("/nonexistent/clone/theme.json", &link).unwrap();

        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();

        assert_eq!(stats.linked, 1);
        assert!(std::fs::read_link(&link).unwrap().starts_with(&s.managed));
    }

    #[test]
    fn test_prunes_managed_owned_leftovers_only() {
        let s = setup(".json");
        std::fs::create_dir_all(&s.app_dir).unwrap();
        // Managed-owned link whose theme no longer exists upstream.
        std::os::unix::fs::symlink(
            s.managed.join("jpn").join("black-atom-gone.json"),
            s.app_dir.join("black-atom-gone.json"),
        )
        .unwrap();
        // Foreign link (user's clone farm) — not ours to prune.
        std::os::unix::fs::symlink(
            "/somewhere/else/black-atom-foreign.json",
            s.app_dir.join("black-atom-foreign.json"),
        )
        .unwrap();

        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();

        assert_eq!(stats.pruned, 1);
        assert!(!s.app_dir.join("black-atom-gone.json").exists());
        assert!(
            std::fs::symlink_metadata(s.app_dir.join("black-atom-foreign.json")).is_ok(),
            "foreign symlink must survive"
        );
    }

    #[test]
    fn test_never_touches_a_real_file() {
        let s = setup(".json");
        std::fs::create_dir_all(&s.app_dir).unwrap();
        let real = s.app_dir.join("black-atom-jpn-koyo-yoru.json");
        std::fs::write(&real, "user's own file").unwrap();

        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();

        assert_eq!(stats.skipped, vec!["black-atom-jpn-koyo-yoru.json"]);
        assert_eq!(std::fs::read_to_string(&real).unwrap(), "user's own file");
    }

    #[test]
    fn test_rerun_is_stable() {
        let s = setup(".json");
        sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();
        let stats = sync_flat_symlinks(&s.managed, &s.app_dir, ".json").unwrap();
        assert_eq!(stats.linked, 1);
        assert_eq!(stats.pruned, 0);
        assert!(stats.skipped.is_empty());
    }

    fn vault_setup() -> Setup {
        let s = setup(".css");
        std::fs::write(s.managed.join("theme.css"), "merged css").unwrap();
        std::fs::write(s.managed.join("manifest.json"), "{\"name\":\"Black Atom\"}").unwrap();
        s
    }

    #[test]
    fn test_vault_links_theme_pair_into_named_dir() {
        let s = vault_setup();
        let stats = sync_vault_theme_links(&s.managed, &s.app_dir).unwrap();

        assert_eq!(stats.linked, 2);
        let theme_dir = s.app_dir.join(OBSIDIAN_THEME_DIR);
        for name in ["theme.css", "manifest.json"] {
            let target = std::fs::read_link(theme_dir.join(name)).unwrap();
            assert!(target.starts_with(&s.managed));
        }
    }

    #[test]
    fn test_vault_links_only_the_pair_never_collection_themes() {
        let s = vault_setup();
        std::fs::create_dir_all(s.managed.join("default")).unwrap();
        std::fs::write(
            s.managed
                .join("default")
                .join("black-atom-default-dark.css"),
            "generated",
        )
        .unwrap();

        let stats = sync_vault_theme_links(&s.managed, &s.app_dir).unwrap();

        assert_eq!(stats.linked, 2);
        let theme_dir = s.app_dir.join(OBSIDIAN_THEME_DIR);
        let mut names: Vec<String> = std::fs::read_dir(&theme_dir)
            .unwrap()
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect();
        names.sort();
        assert_eq!(names, vec!["manifest.json", "theme.css"]);
    }

    #[test]
    fn test_vault_missing_managed_pair_is_an_error() {
        let s = setup(".css"); // no theme.css/manifest.json written
        let err = sync_vault_theme_links(&s.managed, &s.app_dir).unwrap_err();
        assert!(err.contains("SYNC THEMES"), "unexpected error: {err}");
    }

    #[test]
    fn test_vault_never_touches_real_files_and_rerun_is_stable() {
        let s = vault_setup();
        let theme_dir = s.app_dir.join(OBSIDIAN_THEME_DIR);
        std::fs::create_dir_all(&theme_dir).unwrap();
        std::fs::write(theme_dir.join("theme.css"), "hand-installed").unwrap();

        let stats = sync_vault_theme_links(&s.managed, &s.app_dir).unwrap();
        assert_eq!(stats.skipped, vec!["theme.css"]);
        assert_eq!(stats.linked, 1);
        assert_eq!(
            std::fs::read_to_string(theme_dir.join("theme.css")).unwrap(),
            "hand-installed"
        );

        let rerun = sync_vault_theme_links(&s.managed, &s.app_dir).unwrap();
        assert_eq!(rerun.linked, 1);
        assert_eq!(rerun.skipped, vec!["theme.css"]);
    }
}
