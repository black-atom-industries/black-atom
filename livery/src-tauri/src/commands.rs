//! Tauri command surface. Every command is a thin wrapper over a plain
//! `livery_core` function, so the domain logic stays callable without Tauri.

use livery_core::config::types::{AppName, Config};
use livery_core::themes::commands::{DownloadResult, LinkThemesResult, ThemesStatus};
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

/// Download one adapter's theme files into the managed themes directory.
/// Pure fetch — wiring apps to the files is adapter setup (link_app_themes
/// for zed/ghostty, config-pointed themes_path for tmux/lazygit).
#[tauri::command]
#[specta::specta]
pub async fn download_theme(app: AppName) -> DownloadResult {
    livery_core::themes::commands::download_theme(app).await
}

/// Read the managed themes manifest for the frontend's greeting gate and
/// the settings SYNC display.
#[tauri::command]
#[specta::specta]
pub async fn get_themes_status() -> ThemesStatus {
    livery_core::themes::commands::get_themes_status().await
}

/// Wire an adapter's own themes location to the managed downloads via
/// symlinks (create, heal, prune). Explicit adapter-setup action — never
/// runs implicitly on download. The target dir is derived from the
/// adapter's CONFIGURED config_path (its sibling `themes/`; for obsidian
/// that is `<vault>/.obsidian/themes/`), so custom setups link into the
/// right place.
#[tauri::command]
#[specta::specta]
pub async fn link_app_themes(app: AppName) -> LinkThemesResult {
    livery_core::themes::commands::link_app_themes(app).await
}

/// Persist the greeting's "continue without" choice so hand-managed setups
/// aren't greeted on every launch.
#[tauri::command]
#[specta::specta]
pub async fn dismiss_themes_greeting() -> Result<(), String> {
    livery_core::themes::commands::dismiss_themes_greeting().await
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

/// Check one adapter's config_path: does it exist, and does its
/// match_pattern hit? Read-only — never writes.
#[tauri::command]
#[specta::specta]
pub async fn verify_app_path(app: AppName) -> AppPathVerification {
    livery_core::updaters::verify_app_path(app).await
}
