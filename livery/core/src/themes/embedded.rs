//! The adapter theme files compiled into the binary.
//!
//! Livery ships every adapter's generated output, so a fresh install has
//! themes without a network round trip. The templates and repo noise ride
//! along in the embedded dirs; `unpack` decides what reaches the disk.

use std::borrow::Cow;
use std::path::{Path, PathBuf};

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
    Tuicr,
    Waybar,
    Wezterm,
    Zed,
}

impl Adapter {
    pub const ALL: [Adapter; 11] = [
        Adapter::Ghostty,
        Adapter::Herdr,
        Adapter::Lazygit,
        Adapter::Niri,
        Adapter::Nvim,
        Adapter::Obsidian,
        Adapter::Tmux,
        Adapter::Tuicr,
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
            Adapter::Tuicr => "tuicr",
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
            AppName::Tuicr => Some(Adapter::Tuicr),
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
static TUICR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/tuicr/themes");
static WAYBAR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/waybar/themes");
static WEZTERM: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/wezterm/themes");
static ZED: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/zed/themes");

/// The nvim colorschemes are entry points that require the runtime under
/// `lua/black-atom/`, so both directories ship.
static NVIM_COLORS: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/nvim/colors");
static NVIM_LUA: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../adapters/nvim/lua");

/// Obsidian installs a merged theme into a configuration folder as this pair, which lives at
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
        Adapter::Tuicr => vec![("", &TUICR)],
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

/// The repo's `adapters/` dir, which the embedded dirs above are copied from.
const ADAPTERS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../adapters");

/// Where each embedded dir and extra file lives under `adapters/`.
fn repo_dir(adapter: Adapter, prefix: &str) -> String {
    match (adapter, prefix) {
        (Adapter::Nvim, prefix) => format!("nvim/{prefix}"),
        (adapter, _) => format!("{}/themes", adapter.dir_name()),
    }
}

/// Which part of an adapter's unpacked dir a payload file belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Origin {
    /// A file inside an embedded dir, unpacked under this prefix.
    Dir(&'static str),
    /// A file from [`extra_files`], unpacked at the adapter dir root.
    Extra,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PayloadFile {
    pub origin: Origin,
    /// Relative to the embedded dir, or the bare file name for an extra file.
    pub path: PathBuf,
    source: Source,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Source {
    Embedded(&'static [u8]),
    /// Read only when the file is written, so checking the stamp of an
    /// unchanged working tree costs a stat per file.
    Disk {
        path: PathBuf,
        len: u64,
        modified_ns: u128,
    },
}

impl PayloadFile {
    pub fn contents(&self) -> Result<Cow<'static, [u8]>, String> {
        match &self.source {
            Source::Embedded(bytes) => Ok(Cow::Borrowed(bytes)),
            Source::Disk { path, .. } => std::fs::read(path)
                .map(Cow::Owned)
                .map_err(|e| format!("Failed to read {}: {e}", path.display())),
        }
    }

    /// What the stamp hashes: the contents of an embedded file, the size and
    /// modification time of a file on disk.
    pub fn fingerprint(&self) -> Cow<'static, [u8]> {
        match &self.source {
            Source::Embedded(bytes) => Cow::Borrowed(bytes),
            Source::Disk {
                len, modified_ns, ..
            } => Cow::Owned(format!("{len}:{modified_ns}").into_bytes()),
        }
    }
}

/// Every file livery ships for `adapter`. Debug builds read them from the
/// repo's `adapters/` whenever it exists, so a running development build
/// never serves themes older than the working tree; release builds, and
/// debug builds away from the repo, use the embedded copy.
pub fn payload(adapter: Adapter) -> Result<Vec<PayloadFile>, String> {
    let repo = Path::new(ADAPTERS_DIR);
    if cfg!(debug_assertions) && repo.is_dir() {
        payload_from(adapter, Some(repo))
    } else {
        payload_from(adapter, None)
    }
}

/// [`payload`] from `adapters_dir`, or from the embedded copy when `None`.
pub fn payload_from(
    adapter: Adapter,
    adapters_dir: Option<&Path>,
) -> Result<Vec<PayloadFile>, String> {
    let mut files = Vec::new();
    for (prefix, dir) in embedded(adapter) {
        match adapters_dir {
            Some(root) => read_tree(
                &root.join(repo_dir(adapter, prefix)),
                Path::new(""),
                prefix,
                &mut files,
            )?,
            None => collect_embedded(dir, prefix, &mut files),
        }
    }
    for (name, content) in extra_files(adapter) {
        let source = match adapters_dir {
            Some(root) => disk_source(root.join(adapter.dir_name()).join(name))?,
            None => Source::Embedded(content.as_bytes()),
        };
        files.push(PayloadFile {
            origin: Origin::Extra,
            path: PathBuf::from(name),
            source,
        });
    }
    Ok(files)
}

fn collect_embedded(
    dir: &'static Dir<'static>,
    prefix: &'static str,
    files: &mut Vec<PayloadFile>,
) {
    for file in dir.files() {
        files.push(PayloadFile {
            origin: Origin::Dir(prefix),
            path: file.path().to_path_buf(),
            source: Source::Embedded(file.contents()),
        });
    }
    for child in dir.dirs() {
        collect_embedded(child, prefix, files);
    }
}

fn read_tree(
    dir: &Path,
    relative: &Path,
    prefix: &'static str,
    files: &mut Vec<PayloadFile>,
) -> Result<(), String> {
    let entries =
        std::fs::read_dir(dir).map_err(|e| format!("Failed to read {}: {e}", dir.display()))?;
    for entry in entries.flatten() {
        let path = entry.path();
        let relative = relative.join(entry.file_name());
        if path.is_dir() {
            read_tree(&path, &relative, prefix, files)?;
        } else {
            files.push(PayloadFile {
                origin: Origin::Dir(prefix),
                path: relative,
                source: disk_source(path)?,
            });
        }
    }
    Ok(())
}

fn disk_source(path: PathBuf) -> Result<Source, String> {
    let meta =
        std::fs::metadata(&path).map_err(|e| format!("Failed to read {}: {e}", path.display()))?;
    let modified_ns = meta
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map_or(0, |since| since.as_nanos());
    Ok(Source::Disk {
        path,
        len: meta.len(),
        modified_ns,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::types::AppName;

    #[test]
    fn test_every_adapter_embeds_exactly_the_current_keys() {
        fn keys(dir: &Dir<'_>, result: &mut Vec<String>) {
            for file in dir.files() {
                let key = file.path().file_stem().unwrap().to_str().unwrap();
                if key.starts_with("black-atom-") {
                    result.push(key.to_string());
                }
            }
            for child in dir.dirs() {
                keys(child, result);
            }
        }

        let expected: Vec<super::super::catalog::ThemeEntry> =
            serde_json::from_str(include_str!("../../tests/fixtures/catalog.json")).unwrap();
        let expected: Vec<_> = expected.into_iter().map(|theme| theme.key).collect();
        for adapter in Adapter::ALL {
            let mut actual = Vec::new();
            for (_, dir) in embedded(adapter) {
                keys(dir, &mut actual);
            }
            actual.sort();
            actual.dedup();
            assert_eq!(actual, expected, "{}", adapter.dir_name());
        }
    }

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
    fn test_obsidian_config_folder_pair_is_embedded() {
        assert!(OBSIDIAN_THEME_CSS.contains("black-atom"));
        assert!(OBSIDIAN_MANIFEST_JSON.contains("Black Atom"));
    }
}
