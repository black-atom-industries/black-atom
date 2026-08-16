use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// Supported app names. TypeScript bindings are auto-generated via tauri-specta.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum AppName {
    Nvim,
    Tmux,
    Ghostty,
    Zed,
    Delta,
    Lazygit,
    Herdr,
    Obsidian,
    #[serde(rename = "helm-tmux")]
    HelmTmux,
}

impl AppName {
    /// All per-app updater variants. Does not include system-level toggles (system_appearance).
    pub const fn all() -> &'static [AppName] {
        &[
            AppName::Nvim,
            AppName::Tmux,
            AppName::Ghostty,
            AppName::Zed,
            AppName::Delta,
            AppName::Lazygit,
            AppName::Herdr,
            AppName::Obsidian,
            AppName::HelmTmux,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            AppName::Nvim => "nvim",
            AppName::Tmux => "tmux",
            AppName::Ghostty => "ghostty",
            AppName::Zed => "zed",
            AppName::Delta => "delta",
            AppName::Lazygit => "lazygit",
            AppName::Herdr => "herdr",
            AppName::Obsidian => "obsidian",
            AppName::HelmTmux => "helm-tmux",
        }
    }
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    pub config_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub themes_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_pattern: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replace_template: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Keymappings {
    pub toggle_window: String,
}

impl Default for Keymappings {
    fn default() -> Self {
        Self {
            toggle_window: "super+ctrl+alt+shift+KeyT".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Config {
    pub system_appearance: bool,
    #[serde(default)]
    pub keymappings: Keymappings,
    pub apps: HashMap<AppName, AppConfig>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn helm_tmux_serializes_with_its_config_key() {
        assert_eq!(
            serde_json::to_string(&AppName::HelmTmux).unwrap(),
            "\"helm-tmux\""
        );
        assert_eq!(
            serde_json::from_str::<AppName>("\"helm-tmux\"").unwrap(),
            AppName::HelmTmux
        );
    }
}
