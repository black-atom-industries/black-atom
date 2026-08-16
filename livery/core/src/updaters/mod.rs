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
    /// Time taken by the updater in milliseconds.
    /// Set by the dispatcher, not by individual updaters.
    pub duration_ms: Option<u32>,
}

impl UpdateResult {
    pub fn done(app: &str) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Done,
            message: None,
            duration_ms: None,
        }
    }

    pub fn error(app: &str, msg: impl Into<String>) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Error,
            message: Some(msg.into()),
            duration_ms: None,
        }
    }

    pub fn skipped(app: &str, msg: impl Into<String>) -> Self {
        Self {
            app: app.to_string(),
            status: UpdateStatus::Skipped,
            message: Some(msg.into()),
            duration_ms: None,
        }
    }
}

pub async fn update_app(app: AppName, theme: ThemeContext) -> UpdateResult {
    let app_str = app.as_str();

    let mut config = config_io::read_config_from_disk();
    config_io::expand_app_paths(&mut config);

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
    /// `Some(hit)` when the adapter has a match_pattern to check; `None` for
    /// structural patchers (YAML/JSONC merge) where existence is the whole check.
    pub pattern_matches: Option<bool>,
    /// Why verification itself could not run (bad regex, unreadable file).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

pub async fn verify_app_path(app: AppName) -> AppPathVerification {
    let app_str = app.as_str();

    let mut config = config_io::read_config_from_disk();
    config_io::expand_app_paths(&mut config);

    let Some(app_config) = config.apps.get(&app) else {
        return AppPathVerification {
            app: app_str.to_string(),
            exists: false,
            pattern_matches: None,
            message: Some("App not found in config".to_string()),
        };
    };

    match file_ops::verify::verify_path(
        &app_config.config_path,
        app_config.match_pattern.as_deref(),
    ) {
        Ok(v) => AppPathVerification {
            app: app_str.to_string(),
            exists: v.exists,
            pattern_matches: v.pattern_matches,
            message: None,
        },
        Err(e) => AppPathVerification {
            app: app_str.to_string(),
            exists: false,
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
    let (pattern, template) = match (&app_config.match_pattern, &app_config.replace_template) {
        (Some(p), Some(t)) => (p, t),
        _ => return UpdateResult::error(app_str, "Missing match_pattern or replace_template"),
    };

    match file_ops::text::patch_text_file(
        app_config.config_path.clone(),
        pattern.clone(),
        template.clone(),
        ctx.build_variables(),
    ) {
        Ok(()) => {
            log::info!("Updated {} config: {}", app_str, app_config.config_path);
            UpdateResult::done(app_str)
        }
        Err(e) => UpdateResult::error(app_str, e),
    }
}
