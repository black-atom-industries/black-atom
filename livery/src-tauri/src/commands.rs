//! Tauri command surface. Every command is a thin wrapper over a plain
//! `livery_core` function, so the domain logic stays callable without Tauri.

use livery_core::config::types::{AppName, Config, NvimSettings};
use livery_core::themes::commands::{AppStatus, LinkThemesResult};
use livery_core::themes::detect::AppDetection;
use livery_core::updaters::{AppPathVerification, ThemeContext, UpdateResult};

#[tauri::command]
#[specta::specta]
pub fn get_config() -> Config {
    livery_core::config::commands::get_config()
}

#[tauri::command]
#[specta::specta]
pub fn save_config(config: Config) -> Result<(), String> {
    livery_core::config::commands::save_config(config)
}

/// Per-adapter setup state: provisioning class, the config fields its
/// updater reads, and whether its Linked placement is wired on disk.
#[tauri::command]
#[specta::specta]
pub async fn get_app_status() -> Result<Vec<AppStatus>, String> {
    livery_core::themes::commands::get_app_status().await
}

/// Wire an adapter's own themes location to the unpacked theme files via
/// symlinks (create, heal, prune). Explicit adapter-setup action. The
/// target dir is derived from the adapter's CONFIGURED config_path (its
/// sibling `themes/`; for obsidian that is `<vault>/.obsidian/themes/`),
/// so custom setups link into the right place.
#[tauri::command]
#[specta::specta]
pub async fn link_app_themes(app: AppName) -> LinkThemesResult {
    livery_core::themes::commands::link_app_themes(app).await
}

/// Conservative app detection: an app counts as found iff its configured
/// config file exists on disk. No binary lookups, no alternative-path
/// guessing (wizard territory, #35) — better to miss than misconfigure.
#[tauri::command]
#[specta::specta]
pub async fn detect_apps() -> Vec<AppDetection> {
    livery_core::themes::detect::detect_apps().await
}

/// Single entry point for all app updates. The frontend calls this once per app.
///
/// Each invocation reads config from disk independently — this is inherent to the
/// Tauri IPC model where each `invoke` call is a separate request. At the current
/// scale (~5 apps, tiny JSON file) this is fine.
#[tauri::command]
#[specta::specta]
pub async fn update_app(app: AppName, theme: ThemeContext) -> UpdateResult {
    livery_core::updaters::update_app(app, theme).await
}

/// Toggle system-wide dark/light mode. Separate from update_app because system
/// appearance is not an app with AppConfig — it's a standalone boolean toggle.
#[tauri::command]
#[specta::specta]
pub fn update_system_appearance(appearance: String) -> UpdateResult {
    livery_core::updaters::update_system_appearance(appearance)
}

/// Save the Neovim plugin settings and write them into the managed Lua
/// block in nvim's SETTINGS_PATH. The file must already exist — Livery
/// patches a Neovim entry point, it does not create one.
#[tauri::command]
#[specta::specta]
pub async fn write_nvim_settings(settings: NvimSettings) -> UpdateResult {
    livery_core::updaters::write_nvim_settings(settings).await
}

/// Check one adapter's config_path: does it exist, and does its
/// match_pattern hit? Read-only — never writes.
#[tauri::command]
#[specta::specta]
pub async fn verify_app_path(app: AppName) -> AppPathVerification {
    livery_core::updaters::verify_app_path(app).await
}
