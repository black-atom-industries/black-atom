use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

/// Update Zed's settings.json with the theme display name.
///
/// Handles two formats:
/// - Flat: `"theme": "Theme Name"` → sets "theme" directly
/// - Object: `"theme": { "dark": "...", "light": "..." }` → sets "theme.dark" or "theme.light"
///
/// Auto-detects format by checking if the "theme" value is a string or object.
/// Zed should auto-reload on file change, but has a known bug where external
/// changes aren't always detected (zed-industries/zed#38109).
/// Fix expected in Zed stable ~March 25, 2026 via zed-industries/zed#51208.
/// See DEV-331 for tracking.
pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let theme_label = match ctx.theme_label {
        Some(name) if !name.is_empty() => name,
        _ => return UpdateResult::error(app_str, "Missing theme_label for Zed theme"),
    };

    // Detect theme format by reading the file and checking the "theme" value type
    let Some(config_path) = app_config.config_path.as_deref() else {
        return UpdateResult::error(app_str, "Missing config_path");
    };
    let path = shellexpand::tilde(config_path).to_string();
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => return UpdateResult::error(app_str, format!("Failed to read {path}: {e}")),
    };

    let key_path = match detect_theme_format(&content) {
        ThemeFormat::FlatString => "theme",
        ThemeFormat::Object => {
            if ctx.appearance == "dark" {
                "theme.dark"
            } else {
                "theme.light"
            }
        }
        ThemeFormat::NotFound => {
            return UpdateResult::error(app_str, "No 'theme' key found in Zed settings");
        }
    };

    if let Err(e) =
        file_ops::jsonc::patch_jsonc_file(config_path.to_string(), key_path, theme_label)
    {
        return UpdateResult::error(app_str, e);
    }
    log::info!("Updated zed settings: {} (key: {})", config_path, key_path);

    // Zed silently keeps the previous theme when the display name matches no
    // installed theme (broken adapter symlink, missing extension) — surface
    // that as degraded instead of success.
    if theme_installed(theme_label) == Some(false) {
        let msg = format!(
            "Config patched; theme \"{theme_label}\" is not installed in Zed — it will keep the previous theme"
        );
        log::warn!("{msg}");
        return UpdateResult::skipped(app_str, msg);
    }

    UpdateResult::done(app_str)
}

/// Directories Zed loads themes from: user themes + installed extensions.
fn zed_theme_dirs() -> Vec<std::path::PathBuf> {
    let Some(home) = dirs::home_dir() else {
        return Vec::new();
    };
    let mut dirs = vec![home.join(".config/zed/themes")];
    for ext_root in [
        home.join("Library/Application Support/Zed/extensions/installed"),
        home.join(".local/share/zed/extensions/installed"),
    ] {
        let Ok(entries) = std::fs::read_dir(ext_root) else {
            continue;
        };
        dirs.extend(entries.flatten().map(|e| e.path().join("themes")));
    }
    dirs
}

/// Whether any installed Zed theme file carries `theme_label` as a name.
/// `None` = unverifiable (no theme dirs at all) — stay quiet rather than
/// degrade every apply on an unusual setup.
///
/// Matches by verbatim substring: display names ("Black Atom — JPN ∷ …")
/// appear literally in the theme JSON, and a broken symlink fails
/// read_to_string — exactly the case that must be caught.
fn theme_installed(theme_label: &str) -> Option<bool> {
    theme_installed_in(&zed_theme_dirs(), theme_label)
}

fn theme_installed_in(dirs: &[std::path::PathBuf], theme_label: &str) -> Option<bool> {
    let needle = format!("\"{theme_label}\"");
    let mut scanned_any_dir = false;

    for dir in dirs {
        let Ok(entries) = std::fs::read_dir(dir) else {
            continue;
        };
        scanned_any_dir = true;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_none_or(|ext| ext != "json") {
                continue;
            }
            let Ok(content) = std::fs::read_to_string(&path) else {
                continue; // broken symlink or unreadable — cannot provide the theme
            };
            if content.contains(&needle) {
                return Some(true);
            }
        }
    }

    if scanned_any_dir {
        Some(false)
    } else {
        None
    }
}

enum ThemeFormat {
    FlatString,
    Object,
    NotFound,
}

/// Detect whether the "theme" key in the JSONC content is a string or an object.
fn detect_theme_format(content: &str) -> ThemeFormat {
    let root = match jsonc_parser::cst::CstRootNode::parse(
        content,
        &jsonc_parser::ParseOptions::default(),
    ) {
        Ok(r) => r,
        Err(_) => return ThemeFormat::NotFound,
    };

    let root_obj = match root.object_value() {
        Some(obj) => obj,
        None => return ThemeFormat::NotFound,
    };

    let prop = match root_obj.get("theme") {
        Some(p) => p,
        None => return ThemeFormat::NotFound,
    };

    match prop.value() {
        Some(val) if val.as_object().is_some() => ThemeFormat::Object,
        Some(_) => ThemeFormat::FlatString,
        None => ThemeFormat::NotFound,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join(name)
    }

    /// Build a fake Zed themes dir in a temp dir: one real theme family
    /// fixture, one dangling symlink (the case found in the wild), one
    /// non-json file.
    fn fake_themes_dir() -> tempfile::TempDir {
        let dir = tempfile::tempdir().unwrap();
        std::fs::copy(
            fixture_path("jsonc/zed-theme-family.json"),
            dir.path().join("black-atom-jpn-tsuki-yoru.json"),
        )
        .unwrap();
        std::os::unix::fs::symlink(
            dir.path().join("does-not-exist.json"),
            dir.path().join("black-atom-north-night.json"),
        )
        .unwrap();
        std::fs::write(dir.path().join("README.md"), "not a theme").unwrap();
        dir
    }

    #[test]
    fn test_theme_installed_finds_name_in_theme_file() {
        let dir = fake_themes_dir();
        let dirs = vec![dir.path().to_path_buf()];
        assert_eq!(
            theme_installed_in(&dirs, "Black Atom — JPN ∷ Tsuki Yoru"),
            Some(true)
        );
    }

    #[test]
    fn test_theme_installed_reports_missing_theme() {
        let dir = fake_themes_dir();
        let dirs = vec![dir.path().to_path_buf()];
        // The NORTH theme file is a dangling symlink — it must NOT count.
        assert_eq!(
            theme_installed_in(&dirs, "Black Atom — NORTH ∷ Night"),
            Some(false)
        );
    }

    #[test]
    fn test_theme_installed_unverifiable_without_dirs() {
        let dirs = vec![PathBuf::from("/definitely/not/a/dir")];
        assert_eq!(theme_installed_in(&dirs, "Anything"), None);
    }
}
