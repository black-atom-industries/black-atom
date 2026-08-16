//! The adapter theme files compiled into the binary.
//!
//! Livery ships every adapter's generated output, so a fresh install has
//! themes without a network round trip. The templates and repo noise ride
//! along in the embedded dirs; `unpack` decides what reaches the disk.

use include_dir::{include_dir, Dir};

/// One embedded adapter. Wider than `AppName`: niri, waybar, and wezterm have
/// no livery updater but their themes ship all the same, and the unpacked
/// tree is what a user's own tooling reads.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Adapter {
    Ghostty,
    Herdr,
    Lazygit,
    Niri,
    Nvim,
    Obsidian,
    Tmux,
    Waybar,
    Wezterm,
    Zed,
}

impl Adapter {
    pub const ALL: [Adapter; 10] = [
        Adapter::Ghostty,
        Adapter::Herdr,
        Adapter::Lazygit,
        Adapter::Niri,
        Adapter::Nvim,
        Adapter::Obsidian,
        Adapter::Tmux,
        Adapter::Waybar,
        Adapter::Wezterm,
        Adapter::Zed,
    ];

    /// Directory name under the themes root, and the adapter's dir name in
    /// the monorepo.
    pub fn dir_name(self) -> &'static str {
        match self {
            Adapter::Ghostty => "ghostty",
            Adapter::Herdr => "herdr",
            Adapter::Lazygit => "lazygit",
            Adapter::Niri => "niri",
            Adapter::Nvim => "nvim",
            Adapter::Obsidian => "obsidian",
            Adapter::Tmux => "tmux",
            Adapter::Waybar => "waybar",
            Adapter::Wezterm => "wezterm",
            Adapter::Zed => "zed",
        }
    }
}

impl crate::config::types::AppName {
    /// The embedded adapter behind this app, if livery ships theme files for
    /// it. Delta has no adapter repo and helm-tmux compiles its themes in.
    pub fn adapter(self) -> Option<Adapter> {
        use crate::config::types::AppName;
        match self {
            AppName::Ghostty => Some(Adapter::Ghostty),
            AppName::Herdr => Some(Adapter::Herdr),
            AppName::Lazygit => Some(Adapter::Lazygit),
            AppName::Nvim => Some(Adapter::Nvim),
            AppName::Obsidian => Some(Adapter::Obsidian),
            AppName::Tmux => Some(Adapter::Tmux),
            AppName::Zed => Some(Adapter::Zed),
            AppName::Delta | AppName::HelmTmux => None,
        }
    }
}

static GHOSTTY: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/ghostty/themes");
static HERDR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/herdr/themes");
static LAZYGIT: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/lazygit/themes");
static NIRI: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/niri/themes");
static OBSIDIAN: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/obsidian/themes");
static TMUX: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/tmux/themes");
static WAYBAR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/waybar/themes");
static WEZTERM: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/wezterm/themes");
static ZED: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/zed/themes");

/// The nvim colorschemes are entry points that require the runtime under
/// `lua/black-atom/`, so both directories ship.
static NVIM_COLORS: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/nvim/colors");
static NVIM_LUA: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/nvim/lua");

/// Obsidian installs a merged theme into a vault as this pair, which lives at
/// the adapter root rather than under `themes/`.
pub const OBSIDIAN_THEME_CSS: &str = include_str!("../../../../adapters/obsidian/theme.css");
pub const OBSIDIAN_MANIFEST_JSON: &str =
    include_str!("../../../../adapters/obsidian/manifest.json");

/// Where an adapter's embedded content lands inside its unpacked dir. The
/// prefix is `""` for adapters whose `themes/` dir maps onto the adapter dir.
pub fn embedded(adapter: Adapter) -> Vec<(&'static str, &'static Dir<'static>)> {
    match adapter {
        Adapter::Ghostty => vec![("", &GHOSTTY)],
        Adapter::Herdr => vec![("", &HERDR)],
        Adapter::Lazygit => vec![("", &LAZYGIT)],
        Adapter::Niri => vec![("", &NIRI)],
        Adapter::Obsidian => vec![("", &OBSIDIAN)],
        Adapter::Tmux => vec![("", &TMUX)],
        Adapter::Waybar => vec![("", &WAYBAR)],
        Adapter::Wezterm => vec![("", &WEZTERM)],
        Adapter::Zed => vec![("", &ZED)],
        Adapter::Nvim => vec![("colors", &NVIM_COLORS), ("lua", &NVIM_LUA)],
    }
}

/// Files that sit at the adapter dir root rather than inside an embedded dir.
pub fn extra_files(adapter: Adapter) -> &'static [(&'static str, &'static str)] {
    match adapter {
        Adapter::Obsidian => &[
            ("theme.css", OBSIDIAN_THEME_CSS),
            ("manifest.json", OBSIDIAN_MANIFEST_JSON),
        ],
        _ => &[],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::types::AppName;

    #[test]
    fn test_every_adapter_carries_files() {
        for adapter in Adapter::ALL {
            let files: usize = embedded(adapter)
                .iter()
                .map(|(_, dir)| dir.files().count() + dir.dirs().count())
                .sum();
            assert!(
                files > 0,
                "{} embedded nothing — check the include_dir path",
                adapter.dir_name()
            );
        }
    }

    #[test]
    fn test_app_names_map_onto_adapters() {
        for app in AppName::all() {
            let expected = !matches!(app, AppName::Delta | AppName::HelmTmux);
            assert_eq!(app.adapter().is_some(), expected, "{}", app.as_str());
        }
    }

    #[test]
    fn test_obsidian_vault_pair_is_embedded() {
        assert!(OBSIDIAN_THEME_CSS.contains("black-atom"));
        assert!(OBSIDIAN_MANIFEST_JSON.contains("Black Atom"));
    }
}
