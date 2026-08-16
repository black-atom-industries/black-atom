use crate::config::types::AppName;

/// Theme provisioning — who consumes the managed theme files (see ADAPTERS.md).
///
/// - `External`: the app's theme files are provided outside of livery (plugin,
///   compiled binary, or the user), so livery only performs switching.
/// - `Linked`: livery symlinks the downloaded files into a location the app
///   itself reads; switching selects one via a pointer in the app's config.
/// - `Merged`: the app cannot read external theme files, so on every switch
///   livery reads the downloaded theme and writes its values into the config.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum ThemeProvisioning {
    External,
    Linked,
    Merged,
}

pub fn provisioning(app: AppName) -> ThemeProvisioning {
    match app {
        AppName::Nvim | AppName::HelmTmux | AppName::Delta => ThemeProvisioning::External,
        AppName::Ghostty | AppName::Zed | AppName::Tmux | AppName::Obsidian => {
            ThemeProvisioning::Linked
        }
        AppName::Lazygit | AppName::Herdr => ThemeProvisioning::Merged,
    }
}

/// How an adapter repo lays out its committed theme output.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExtractLayout {
    /// `themes/<collection>/black-atom-*.<ext>` — the common adapter layout
    /// (ghostty, tmux, lazygit, zed, herdr).
    Collections,
    /// The common layout plus the merged root `theme.css` + `manifest.json`
    /// pair Obsidian installs into a vault.
    ObsidianMerged,
}

/// Where an adapter's theme files come from.
pub struct AdapterDistribution {
    /// Repo name under the black-atom-industries GitHub org.
    pub repo: &'static str,
    pub layout: ExtractLayout,
}

/// V1 stand-in for a distribution/readiness flag in `black-atom-adapter.json`
/// (planned core schema addition) — until adapters declare it themselves,
/// livery carries the knowledge. `None` ⇔ External provisioning: nothing to
/// download (nvim's files ship with its plugin, helm compiles themes into its
/// binary, delta has no adapter repo).
pub fn distribution(app: AppName) -> Option<AdapterDistribution> {
    match app {
        AppName::Ghostty => Some(AdapterDistribution {
            repo: "ghostty",
            layout: ExtractLayout::Collections,
        }),
        AppName::Tmux => Some(AdapterDistribution {
            repo: "tmux",
            layout: ExtractLayout::Collections,
        }),
        AppName::Lazygit => Some(AdapterDistribution {
            repo: "lazygit",
            layout: ExtractLayout::Collections,
        }),
        AppName::Zed => Some(AdapterDistribution {
            repo: "zed",
            layout: ExtractLayout::Collections,
        }),
        AppName::Obsidian => Some(AdapterDistribution {
            repo: "obsidian",
            layout: ExtractLayout::ObsidianMerged,
        }),
        AppName::Herdr => Some(AdapterDistribution {
            repo: "herdr",
            layout: ExtractLayout::Collections,
        }),
        AppName::Nvim | AppName::Delta | AppName::HelmTmux => None,
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
    /// The vault's `themes/Black Atom/` dir gets the merged `theme.css` +
    /// `manifest.json` pair — Obsidian scans per-theme subdirectories.
    VaultThemeDir,
}

pub fn linked_placement(app: AppName) -> Option<LinkedPlacement> {
    match app {
        AppName::Ghostty | AppName::Tmux => Some(LinkedPlacement::FlatByExtension(".conf")),
        AppName::Zed => Some(LinkedPlacement::FlatByExtension(".json")),
        AppName::Obsidian => Some(LinkedPlacement::VaultThemeDir),
        AppName::Nvim | AppName::HelmTmux | AppName::Delta | AppName::Lazygit | AppName::Herdr => {
            None
        }
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
}

/// Config fields each adapter's updater actually reads — HAND-MAINTAINED
/// against `livery/core/src/updaters/*` and the `dispatch_update` router in
/// `updaters/mod.rs`. Update this alongside any updater change.
///
/// nvim/ghostty/tmux have dedicated updaters; delta and helm route through
/// the shared `patch_text_updater`, so all five read pattern+template. zed
/// and obsidian patch structurally (JSONC) off `config_path` alone. tmux,
/// lazygit, and herdr additionally point `themes_path` at the managed download dir.
pub fn editable_fields(app: AppName) -> Vec<AdapterEditableField> {
    use AdapterEditableField::*;
    match app {
        AppName::Nvim | AppName::Ghostty | AppName::HelmTmux | AppName::Delta => {
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
        }
        AppName::Tmux => vec![ConfigPath, ThemesPath, MatchPattern, ReplaceTemplate],
        AppName::Zed | AppName::Obsidian => vec![ConfigPath],
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
            vec![ConfigPath, MatchPattern, ReplaceTemplate]
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
        assert_eq!(editable_fields(AppName::Obsidian), vec![ConfigPath]);
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

    #[test]
    fn test_external_iff_no_distribution() {
        for app in AppName::all() {
            assert_eq!(
                distribution(*app).is_none(),
                provisioning(*app) == ThemeProvisioning::External,
                "distribution/provisioning mismatch for {}",
                app.as_str()
            );
        }
    }
}
