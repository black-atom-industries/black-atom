pub mod file_ops;
mod ghostty;
mod herdr;
mod lazygit;
pub mod nvim;
mod obsidian;
pub mod system_appearance;
mod tmux;
mod zed;

use std::collections::HashMap;

use serde::Serialize;
use specta::Type;

use serde::Deserialize;

use crate::config::{io as config_io, types::AppName};

/// Theme metadata passed from the frontend.
#[derive(Debug, Deserialize, Type)]
pub struct ThemeContext {
    pub theme_key: String,
    pub appearance: String,
    pub collection_key: String,
    pub theme_label: Option<String>,
}

/// Context passed to each per-app updater.
///
/// `themes_path` is cloned from AppConfig for use in `build_variables()` template rendering.
/// Per-app updaters that need it as a path (e.g., lazygit) read it from AppConfig directly.
/// `theme_label` is the formatted theme label for apps like Zed that need display names.
pub struct UpdateContext<'a> {
    pub theme_key: &'a str,
    pub appearance: &'a str,
    pub collection_key: &'a str,
    pub theme_label: Option<&'a str>,
    pub themes_path: Option<String>,
}

impl UpdateContext<'_> {
    /// Build the template variable map for text-based patching.
    pub fn build_variables(&self) -> HashMap<String, String> {
        let mut vars = HashMap::new();
        vars.insert("themeKey".to_string(), self.theme_key.to_string());
        vars.insert("appearance".to_string(), self.appearance.to_string());
        vars.insert("collectionKey".to_string(), self.collection_key.to_string());
        if let Some(ref tp) = self.themes_path {
            vars.insert("themesPath".to_string(), tp.clone());
        }
        vars
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum UpdateStatus {
    Done,
    Error,
    Skipped,
}

impl UpdateStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Done => "done",
            Self::Error => "error",
            Self::Skipped => "skipped",
        }
    }
}

#[derive(Debug, Serialize, Type)]
pub struct UpdateResult {
    pub app: String,
    pub status: UpdateStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    /// Per-configuration-folder outcomes for Obsidian's batch update.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_folders: Option<Vec<ConfigFolderOutcome>>,
    /// Time taken by the updater in milliseconds.
    /// Set by the dispatcher, not by individual updaters.
    pub duration_ms: Option<u32>,
}

#[derive(Debug, Serialize, Type)]
pub struct ConfigFolderOutcome {
    pub config_folder: String,
    pub status: UpdateStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reload_warning: Option<String>,
}

impl UpdateResult {
    pub fn done(app: &str) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Done,
            message: None,
            config_folders: None,
            duration_ms: None,
        }
    }

    pub fn error(app: &str, msg: impl Into<String>) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Error,
            message: Some(msg.into()),
            config_folders: None,
            duration_ms: None,
        }
    }

    pub fn skipped(app: &str, msg: impl Into<String>) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Skipped,
            message: Some(msg.into()),
            config_folders: None,
            duration_ms: None,
        }
    }
}

pub async fn update_app(app: AppName, theme: ThemeContext) -> UpdateResult {
    let app_str = app.as_str();

    let mut config = config_io::read_config_from_disk();
    config_io::expand_app_paths(&mut config);

    // Merged updaters read the unpacked theme files, Linked ones follow
    // symlinks into the same tree — either way it has to exist first.
    if let Err(message) = crate::themes::unpack::ensure_unpacked() {
        return UpdateResult::error(app_str, message);
    }

    let app_config = match config.apps.get(&app) {
        Some(c) => c.clone(),
        None => return UpdateResult::error(app_str, "App not found in config"),
    };

    if !app_config.enabled {
        return UpdateResult::skipped(app_str, "App is disabled");
    }

    let ctx = UpdateContext {
        theme_key: &theme.theme_key,
        appearance: &theme.appearance,
        collection_key: &theme.collection_key,
        theme_label: theme.theme_label.as_deref(),
        themes_path: app_config.themes_path.clone(),
    };

    let start = std::time::Instant::now();
    let mut result = dispatch_update(app, &app_config, &ctx);
    let elapsed = start.elapsed().as_millis() as u32;
    result.duration_ms = Some(elapsed);
    log::info!(
        "{} finished in {}ms ({})",
        app_str,
        elapsed,
        result.status.as_str()
    );

    result
}

/// Write the Neovim plugin settings into the managed Lua block in nvim's
/// `settings_path`, then store them in config. Config is the source of
/// truth; the block is the projection of it Neovim can read. Persisting
/// only after a successful write keeps the two from drifting apart.
pub async fn write_nvim_settings(settings: crate::config::types::NvimSettings) -> UpdateResult {
    let mut config = config_io::read_config_from_disk();
    let Some(app_config) = config.apps.get_mut(&AppName::Nvim) else {
        return UpdateResult::error("nvim", "nvim not found in config");
    };

    let settings_path = app_config
        .settings_path
        .clone()
        .unwrap_or_else(|| crate::config::types::NVIM_SETTINGS_PATH.to_string());

    let result = nvim::write_settings(&settings_path, &settings);
    if result.status == UpdateStatus::Error {
        return result;
    }

    app_config.settings = Some(settings);
    if let Err(e) = crate::config::commands::save_config(config) {
        return UpdateResult::error("nvim", e);
    }

    result
}

/// Dispatch an update to the appropriate per-app updater.
/// Public so the benchmark binary can call it without going through the Tauri command wrapper.
pub fn dispatch_update(
    app: AppName,
    app_config: &crate::config::types::AppConfig,
    ctx: &UpdateContext,
) -> UpdateResult {
    let app_str = app.as_str();
    match app {
        AppName::Ghostty => ghostty::update(app_str, app_config, ctx),
        AppName::Nvim => nvim::update(app_str, app_config, ctx, None),
        AppName::Tmux => tmux::update(app_str, app_config, ctx),
        AppName::Delta => patch_text_updater(app_str, app_config, ctx),
        AppName::HelmTmux => patch_text_updater(app_str, app_config, ctx),
        AppName::Lazygit => lazygit::update(app_str, app_config, ctx),
        AppName::Herdr => herdr::update(app_str, app_config, ctx),
        AppName::Zed => zed::update(app_str, app_config, ctx),
        AppName::Obsidian => obsidian::update(app_str, app_config, ctx),
    }
}

/// Result of `verify_app_path` — backs the settings screen's [ VERIFY PATH ].
#[derive(Debug, Serialize, Type)]
pub struct AppPathVerification {
    pub app: String,
    pub exists: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_folders: Option<Vec<ConfigFolderPathVerification>>,
    /// `Some(hit)` when the adapter has a match_pattern to check; `None` for
    /// structural patchers (YAML/JSONC merge) where existence is the whole check.
    pub pattern_matches: Option<bool>,
    /// Why verification itself could not run (bad regex, unreadable file).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Type)]
pub struct ConfigFolderPathVerification {
    /// The configured identity used by the settings UI to associate the result.
    pub config_folder: String,
    /// The expanded filesystem path that was checked.
    pub path: String,
    pub exists: bool,
}

pub async fn verify_app_path(app: AppName) -> AppPathVerification {
    let app_str = app.as_str();

    let mut config = config_io::read_config_from_disk();
    config_io::expand_app_paths(&mut config);

    let Some(app_config) = config.apps.get(&app) else {
        return AppPathVerification {
            app: app_str.to_string(),
            exists: false,
            config_folders: None,
            pattern_matches: None,
            message: Some("App not found in config".to_string()),
        };
    };

    if app == AppName::Obsidian {
        let configured_folders = config_io::configured_config_folders(app_config);
        let config_folders = configured_folders
            .iter()
            .map(|folder| {
                let config_folder =
                    std::path::PathBuf::from(shellexpand::tilde(folder).to_string());
                let appearance = config_folder.join("appearance.json");
                ConfigFolderPathVerification {
                    config_folder: folder.to_string(),
                    path: appearance.to_string_lossy().into_owned(),
                    exists: appearance.is_file(),
                }
            })
            .collect::<Vec<_>>();
        return AppPathVerification {
            app: app_str.to_string(),
            exists: !config_folders.is_empty() && config_folders.iter().all(|folder| folder.exists),
            config_folders: Some(config_folders),
            pattern_matches: None,
            message: None,
        };
    }

    let Some(config_path) = app_config.config_path.as_deref() else {
        return AppPathVerification {
            app: app_str.to_string(),
            exists: false,
            config_folders: None,
            pattern_matches: None,
            message: Some("Missing config_path".to_string()),
        };
    };
    match file_ops::verify::verify_path(config_path, app_config.match_pattern.as_deref()) {
        Ok(v) => AppPathVerification {
            app: app_str.to_string(),
            exists: v.exists,
            config_folders: None,
            pattern_matches: v.pattern_matches,
            message: None,
        },
        Err(e) => AppPathVerification {
            app: app_str.to_string(),
            exists: false,
            config_folders: None,
            pattern_matches: None,
            message: Some(e),
        },
    }
}

pub fn update_system_appearance(appearance: String) -> UpdateResult {
    let start = std::time::Instant::now();
    let mut result = system_appearance::update(&appearance);
    let elapsed = start.elapsed().as_millis() as u32;
    result.duration_ms = Some(elapsed);
    log::info!(
        "system_appearance finished in {}ms ({})",
        elapsed,
        result.status.as_str()
    );
    result
}

/// Generic text-based updater for apps that only need patch_text_file (no reload).
fn patch_text_updater(
    app_str: &str,
    app_config: &crate::config::types::AppConfig,
    ctx: &UpdateContext,
) -> UpdateResult {
    let Some(config_path) = app_config.config_path.as_deref() else {
        return UpdateResult::error(app_str, "Missing config_path");
    };
    let (pattern, template) = match (&app_config.match_pattern, &app_config.replace_template) {
        (Some(p), Some(t)) => (p, t),
        _ => return UpdateResult::error(app_str, "Missing match_pattern or replace_template"),
    };

    match file_ops::text::patch_text_file(
        config_path.to_string(),
        pattern.clone(),
        template.clone(),
        ctx.build_variables(),
    ) {
        Ok(()) => {
            log::info!("Updated {} config: {}", app_str, config_path);
            UpdateResult::done(app_str)
        }
        Err(e) => UpdateResult::error(app_str, e),
    }
}
