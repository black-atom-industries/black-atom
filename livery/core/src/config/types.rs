use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::BTreeMap;

/// Supported app names. TypeScript bindings are auto-generated via tauri-specta.
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize, Type,
)]
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
    Rex,
    Tuicr,
    #[serde(rename = "claude-code")]
    ClaudeCode,
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
            AppName::Rex,
            AppName::Tuicr,
            AppName::ClaudeCode,
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
            AppName::Rex => "rex",
            AppName::Tuicr => "tuicr",
            AppName::ClaudeCode => "claude-code",
            AppName::HelmTmux => "helm-tmux",
        }
    }
}

fn default_true() -> bool {
    true
}

/// Bold/italic pair for one syntax group. Mirrors
/// `BlackAtom.HighlightDefinition` as far as the settings page exposes it.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct NvimStyle {
    pub bold: bool,
    pub italic: bool,
}

/// Per-group syntax styling. One entry per group the plugin reads.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct NvimSyntax {
    pub comments: NvimStyle,
    pub keywords: NvimStyle,
    pub functions: NvimStyle,
    pub strings: NvimStyle,
    pub variables: NvimStyle,
    pub messages: NvimStyle,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct NvimDiagnostics {
    pub undercurl: bool,
    pub background: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct NvimStyles {
    /// `"none"`, `"partial"`, or `"full"`.
    pub transparency: String,
    pub ending_tildes: bool,
    /// `"fg"` or `"bg"`.
    pub cmp_kind_color_mode: String,
    pub dark_sidebars: bool,
    pub dark_floats: bool,
    pub dark_gutter: bool,
    pub gutter_padding: u8,
    pub diagnostics: NvimDiagnostics,
    pub syntax: NvimSyntax,
}

/// One field per option `adapters/nvim/lua/black-atom/config.lua` declares. The
/// plugin reads this shape from `apps.nvim.settings`, so a renamed field here
/// silently stops reaching it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(default)]
pub struct NvimSettings {
    pub term_colors: bool,
    pub styles: NvimStyles,
}

/// Mirrors `M.defaults` in `adapters/nvim/lua/black-atom/config.lua`. The
/// plugin merges the stored options over those defaults, so an unfaithful
/// default here changes highlights for a user who never opened the settings
/// page. Missing keys in a stored file take these values.
impl Default for NvimSettings {
    fn default() -> Self {
        Self {
            term_colors: true,
            styles: NvimStyles::default(),
        }
    }
}

impl Default for NvimStyles {
    fn default() -> Self {
        Self {
            transparency: "none".to_string(),
            ending_tildes: false,
            cmp_kind_color_mode: "bg".to_string(),
            dark_sidebars: true,
            dark_floats: true,
            dark_gutter: false,
            gutter_padding: 0,
            diagnostics: NvimDiagnostics::default(),
            syntax: NvimSyntax::default(),
        }
    }
}

impl Default for NvimSyntax {
    fn default() -> Self {
        let plain = NvimStyle::default();
        Self {
            comments: NvimStyle {
                bold: false,
                italic: true,
            },
            keywords: NvimStyle {
                bold: true,
                italic: false,
            },
            functions: plain,
            strings: plain,
            variables: plain,
            messages: NvimStyle {
                bold: true,
                italic: false,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Generic adapter config file. Apps configured by config folders leave this
    /// empty and store config folders instead.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config_path: Option<String>,
    /// Config folders, such as `~/Notes/.obsidian` or `~/.claude`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_folders: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub themes_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_pattern: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replace_template: Option<String>,
    /// nvim only: the plugin options, read by the plugin itself.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings: Option<NvimSettings>,
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
    /// Versioned configuration schema. Missing on disk means legacy v1.
    #[serde(default = "legacy_version")]
    pub version: u32,
    pub system_appearance: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_theme: Option<String>,
    #[serde(default)]
    pub keymappings: Keymappings,
    pub apps: BTreeMap<AppName, AppConfig>,
}

fn legacy_version() -> u32 {
    1
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

    #[test]
    fn apps_serialize_in_declaration_order() {
        let mut apps = BTreeMap::new();
        for app in AppName::all().iter().rev() {
            apps.insert(*app, app.as_str());
        }
        let json = serde_json::to_string(&apps).unwrap();
        let positions: Vec<usize> = AppName::all()
            .iter()
            .map(|app| json.find(&format!("\"{}\"", app.as_str())).unwrap())
            .collect();
        assert!(positions.windows(2).all(|w| w[0] < w[1]), "{json}");
    }

    #[test]
    fn config_round_trips_an_optional_active_theme() {
        let mut value = serde_json::to_value(Config::default()).unwrap();
        value["active_theme"] = serde_json::json!("black-atom-jpn-koyo-dark");

        let restored: Config = serde_json::from_value(value).unwrap();
        let serialized = serde_json::to_value(restored).unwrap();

        assert_eq!(
            serialized["active_theme"],
            serde_json::json!("black-atom-jpn-koyo-dark")
        );
    }

    #[test]
    fn partial_nvim_settings_take_the_defaults_for_missing_keys() {
        let partial: NvimSettings =
            serde_json::from_str(r#"{"styles":{"dark_gutter":true}}"#).unwrap();

        let mut expected = NvimSettings::default();
        expected.styles.dark_gutter = true;
        assert_eq!(partial, expected);

        let empty: NvimSettings = serde_json::from_str("{}").unwrap();
        assert_eq!(empty, NvimSettings::default());
    }

    #[test]
    fn nvim_settings_with_a_wrong_type_still_fail() {
        assert!(
            serde_json::from_str::<NvimSettings>(r#"{"styles":{"dark_gutter":"yes"}}"#).is_err()
        );
    }
}
