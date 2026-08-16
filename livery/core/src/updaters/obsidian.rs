use std::path::{Path, PathBuf};

use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

/// Update Obsidian by patching two JSON files in the vault's `.obsidian/` directory:
///
/// 1. `appearance.json` — sets `theme` to "obsidian" (dark) or "moonstone" (light)
/// 2. `plugins/obsidian-style-settings/data.json` — sets the Black Atom variant key
///
/// `config_path` must point to the vault's `.obsidian/appearance.json`.
/// The style settings path is derived from the same parent directory.
pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let appearance_path = &app_config.config_path;

    // Patch appearance.json: set base theme mode
    let obsidian_theme = match ctx.appearance {
        "dark" => "obsidian",
        "light" => "moonstone",
        other => return UpdateResult::error(app_str, format!("Unknown appearance: {other}")),
    };

    if let Err(e) =
        file_ops::jsonc::patch_jsonc_file(appearance_path.clone(), "theme", obsidian_theme)
    {
        return UpdateResult::error(app_str, e);
    }

    // Patch style settings: set the variant key for the current appearance
    let style_settings_path = derive_style_settings_path(appearance_path);
    if let Some(ss_path) = style_settings_path {
        if ss_path.exists() {
            // Flat JSONC keys — "@@" is the Style Settings plugin separator,
            // not a path delimiter (patch_jsonc_file only splits on ".").
            let variant_key = match ctx.appearance {
                "dark" => "black-atom-variants@@dark-theme-variant",
                "light" => "black-atom-variants@@light-theme-variant",
                // Unreachable: first match already errors on unknown appearance
                _ => "black-atom-variants@@light-theme-variant",
            };

            if let Err(e) = file_ops::jsonc::patch_jsonc_file(
                ss_path.to_string_lossy().to_string(),
                variant_key,
                ctx.theme_key,
            ) {
                log::warn!("Style settings patch failed (non-fatal): {e}");
            }
        }
    }

    // Reload only if Obsidian is already running — the `obsidian` CLI can
    // launch the app and block indefinitely when it isn't.
    // Config files are already patched, so the next Obsidian start picks them up.
    if !is_running() {
        log::info!("Obsidian not running, skipping reload (config patched)");
        return UpdateResult::done(app_str);
    }

    if let Err(msg) = reload() {
        log::warn!("{msg}");
        return UpdateResult::skipped(
            app_str,
            format!("Config patched; live reload failed: {msg}"),
        );
    }

    log::info!("Updated obsidian config: {}", appearance_path);
    UpdateResult::done(app_str)
}

/// Derive the style settings data.json path from the appearance.json path.
/// `appearance.json` lives at `<vault>/.obsidian/appearance.json`, so the
/// style settings file is at `<vault>/.obsidian/plugins/obsidian-style-settings/data.json`.
fn derive_style_settings_path(appearance_path: &str) -> Option<PathBuf> {
    let expanded = shellexpand::tilde(appearance_path).to_string();
    let path = Path::new(&expanded);
    path.parent().map(|obsidian_dir| {
        obsidian_dir
            .join("plugins")
            .join("obsidian-style-settings")
            .join("data.json")
    })
}

/// Check whether Obsidian is currently running.
fn is_running() -> bool {
    std::process::Command::new("pgrep")
        .args(["-x", "Obsidian"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Reload the Obsidian vault via the `obsidian` CLI.
/// Only called when Obsidian is already running — the command can launch
/// the app and block indefinitely if it isn't.
fn reload() -> Result<(), String> {
    match std::process::Command::new("obsidian")
        .arg("reload")
        .output()
    {
        Ok(output) => {
            if !output.status.success() {
                log::info!("obsidian reload returned non-zero");
            }
            Ok(())
        }
        Err(e) => Err(format!("Failed to run obsidian reload: {e}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_style_settings_path() {
        let result = derive_style_settings_path("~/notes/.obsidian/appearance.json");
        let expected = dirs::home_dir()
            .unwrap()
            .join("notes/.obsidian/plugins/obsidian-style-settings/data.json");
        assert_eq!(result, Some(expected));
    }

    #[test]
    fn test_derive_style_settings_path_no_parent() {
        let result = derive_style_settings_path("appearance.json");
        // Parent of "appearance.json" is "" which is still Some
        assert!(result.is_some());
    }
}
