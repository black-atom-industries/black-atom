use std::collections::HashMap;

use super::types::{AppConfig, AppName, Config, Keymappings, NvimSettings, NVIM_SETTINGS_PATH};

/// A Merged adapter points at the unpacked theme files directly. Stored
/// absolute: the themes root follows `$XDG_DATA_HOME`, so a `~`-relative
/// form would be a lie on machines that set it.
fn themes_path(adapter: &str) -> String {
    crate::paths::themes_root()
        .join(adapter)
        .to_string_lossy()
        .into_owned()
}

impl Default for Config {
    fn default() -> Self {
        let mut apps = HashMap::new();
        apps.insert(
            AppName::Ghostty,
            AppConfig {
                enabled: false,
                config_path: "~/.config/ghostty/config".to_string(),
                // Name-based lookup: ghostty rejects `~` theme paths, so the
                // download placement tail symlinks each theme file into
                // ~/.config/ghostty/themes instead (themes::symlinks).
                themes_path: None,
                match_pattern: Some(r"^theme\s*=\s*.+$".to_string()),
                replace_template: Some("theme = {themeKey}.conf".to_string()),
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Nvim,
            AppConfig {
                enabled: false,
                config_path: "~/.config/nvim/lua/config.lua".to_string(),
                themes_path: None,
                match_pattern: Some(r#"colorscheme\s*=\s*"[^"]*""#.to_string()),
                replace_template: Some(r#"colorscheme = "{themeKey}""#.to_string()),
                settings_path: Some(NVIM_SETTINGS_PATH.to_string()),
                settings: Some(NvimSettings::default()),
            },
        );
        apps.insert(
            AppName::Tmux,
            AppConfig {
                enabled: false,
                config_path: "~/.config/tmux/tmux.conf".to_string(),
                // Linked placement: LINK THEMES flat-symlinks the managed
                // files into the app-local themes dir, so the source-file
                // pointer never references livery internals. Theme keys are
                // globally unique — flattening collections loses nothing.
                themes_path: Some("~/.config/tmux/themes".to_string()),
                match_pattern: Some(r"^source-file\s+.+/themes/.+\.conf$".to_string()),
                replace_template: Some("source-file {themesPath}/{themeKey}.conf".to_string()),
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Delta,
            AppConfig {
                enabled: false,
                config_path: "~/.gitconfig.delta".to_string(),
                themes_path: None,
                match_pattern: Some(r"features\s*=\s*black-atom-(dark|light)".to_string()),
                replace_template: Some("features = black-atom-{appearance}".to_string()),
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Zed,
            AppConfig {
                enabled: false,
                config_path: "~/.config/zed/settings.json".to_string(),
                themes_path: None,
                match_pattern: None, // not used — JSONC editing is structural
                replace_template: None,
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Lazygit,
            AppConfig {
                enabled: false,
                config_path: "~/.config/lazygit/config.yml".to_string(),
                themes_path: Some(themes_path("lazygit")),
                match_pattern: None,
                replace_template: None,
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Herdr,
            AppConfig {
                enabled: false,
                config_path: "~/.config/herdr/config.toml".to_string(),
                themes_path: Some(themes_path("herdr")),
                match_pattern: None,
                replace_template: None,
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::Obsidian,
            AppConfig {
                enabled: false,
                config_path: String::new(),
                themes_path: None,
                match_pattern: None,
                replace_template: None,
                settings_path: None,
                settings: None,
            },
        );
        apps.insert(
            AppName::HelmTmux,
            AppConfig {
                enabled: false,
                config_path: "~/.config/black-atom/helm-tmux/config.yml".to_string(),
                themes_path: None,
                match_pattern: Some(r"^theme:\s*\S*$".to_string()),
                replace_template: Some("theme: {themeKey}".to_string()),
                settings_path: None,
                settings: None,
            },
        );
        Config {
            system_appearance: true,
            keymappings: Keymappings::default(),
            apps,
        }
    }
}
