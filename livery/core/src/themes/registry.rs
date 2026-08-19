use crate::config::types::AppName;

/// Theme provisioning — who consumes the managed theme files (see ADAPTERS.md).
///
/// - `External`: the app's theme files are provided outside of livery (plugin,
///   compiled binary, or the user), so livery only performs switching.
/// - `Linked`: livery symlinks the unpacked theme files into a location the app
///   itself reads; switching selects one via a pointer in the app's config.
/// - `Merged`: the app cannot read external theme files, so on every switch
///   livery reads the unpacked theme file and writes its values into the config.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum ThemeProvisioning {
    External,
    Linked,
    Merged,
}

pub fn provisioning(app: AppName) -> ThemeProvisioning {
    match app {
        AppName::HelmTmux | AppName::Delta => ThemeProvisioning::External,
        AppName::Ghostty | AppName::Zed | AppName::Tmux | AppName::Obsidian | AppName::Nvim => {
            ThemeProvisioning::Linked
        }
        AppName::Lazygit | AppName::Herdr => ThemeProvisioning::Merged,
    }
}

/// How a Linked adapter's files are placed into the app's scan location.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LinkedPlacement {
    /// Flat symlinks in the app's own themes dir, one per theme file with the
    /// given extension — for apps that look themes up by bare name (zed can't
    /// read outside its dir, ghostty rejects `~` paths, tmux gets a local
    /// `source-file` target). Theme keys are globally unique, so flattening
    /// the collection nesting loses nothing.
    FlatByExtension(&'static str),
    /// Each configuration folder's `themes/Black Atom/` dir gets the merged `theme.css` +
    /// `manifest.json` pair — Obsidian scans per-theme subdirectories.
    ConfigFolderThemeDir,
    /// One directory symlink into neovim's packpath at
    /// `$XDG_DATA_HOME/nvim/site/pack/black-atom/start/black-atom` — neovim
    /// puts `pack/*/start/*` on the runtimepath itself, so the colorschemes
    /// in `colors/` and the runtime under `lua/` are found without a plugin
    /// manager.
    PackDir,
}

pub fn linked_placement(app: AppName) -> Option<LinkedPlacement> {
    match app {
        AppName::Ghostty | AppName::Tmux => Some(LinkedPlacement::FlatByExtension(".conf")),
        AppName::Zed => Some(LinkedPlacement::FlatByExtension(".json")),
        AppName::Obsidian => Some(LinkedPlacement::ConfigFolderThemeDir),
        AppName::Nvim => Some(LinkedPlacement::PackDir),
        AppName::HelmTmux | AppName::Delta | AppName::Lazygit | AppName::Herdr => None,
    }
}

/// A config field an adapter's updater actually reads. Drives which inputs
/// the settings UI offers per adapter — editing a field the updater ignores
/// is silent noise; editing one it does read, wrongly, breaks switching.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum AdapterEditableField {
    ConfigPath,
    ThemesPath,
    MatchPattern,
    ReplaceTemplate,
    /// nvim only: the file the managed Lua settings block is written into.
    SettingsPath,
}

/// Config fields each adapter's updater actually reads — HAND-MAINTAINED
/// against `livery/core/src/updaters/*` and the `dispatch_update` router in
/// `updaters/mod.rs`. Update this alongside any updater change.
///
/// nvim/ghostty/tmux have dedicated updaters; delta and helm route through
/// the shared `patch_text_updater`, so all five read pattern+template. zed
/// patches structurally (JSONC) from `config_path`; obsidian patches each
/// configured Obsidian config folder. tmux, lazygit, and herdr additionally point
/// `themes_path` at the managed themes dir.
/// nvim additionally writes its managed Lua settings block into `settings_path`.
pub fn editable_fields(app: AppName) -> Vec<AdapterEditableField> {
    use AdapterEditableField::*;
    match app {
        AppName::Nvim => vec![ConfigPath, MatchPattern, ReplaceTemplate, SettingsPath],
        AppName::Ghostty | AppName::HelmTmux | AppName::Delta => {
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
        }
        AppName::Tmux => vec![ConfigPath, ThemesPath, MatchPattern, ReplaceTemplate],
        AppName::Zed => vec![ConfigPath],
        AppName::Obsidian => vec![],
        AppName::Lazygit | AppName::Herdr => vec![ConfigPath, ThemesPath],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_editable_fields_matches_updaters() {
        use AdapterEditableField::*;

        // Pins the hand-maintained matrix against updaters/* — a future
        // updater change must consciously update this alongside it.
        assert_eq!(
            editable_fields(AppName::Nvim),
            vec![ConfigPath, MatchPattern, ReplaceTemplate, SettingsPath]
        );
        assert_eq!(
            editable_fields(AppName::Ghostty),
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
        );
        assert_eq!(
            editable_fields(AppName::HelmTmux),
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
        );
        assert_eq!(
            editable_fields(AppName::Delta),
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
        );
        assert_eq!(
            editable_fields(AppName::Tmux),
            vec![ConfigPath, ThemesPath, MatchPattern, ReplaceTemplate]
        );
        assert_eq!(editable_fields(AppName::Zed), vec![ConfigPath]);
        assert_eq!(
            editable_fields(AppName::Obsidian),
            Vec::<AdapterEditableField>::new()
        );
        assert_eq!(
            editable_fields(AppName::Lazygit),
            vec![ConfigPath, ThemesPath]
        );
        assert_eq!(
            editable_fields(AppName::Herdr),
            vec![ConfigPath, ThemesPath]
        );
    }

    #[test]
    fn test_placement_exists_iff_linked() {
        for app in AppName::all() {
            assert_eq!(
                linked_placement(*app).is_some(),
                provisioning(*app) == ThemeProvisioning::Linked,
                "placement/provisioning mismatch for {}",
                app.as_str()
            );
        }
    }
}
