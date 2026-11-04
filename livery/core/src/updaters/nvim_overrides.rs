//! Finds the lines of the user's Neovim config that override Livery: a
//! `black_atom_core_config` assignment, or a `colorscheme` with a literal name.
//! A line scan, not a parser, so a rare false match is accepted.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use regex::Regex;
use serde::Serialize;
use specta::Type;

use crate::paths;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum NvimOverrideKind {
    /// The config sets the plugin options, which win over `config.json`.
    Options,
    /// The config picks a colorscheme by name, so the plugin leaves startup alone.
    Colorscheme,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
pub struct NvimOverride {
    pub kind: NvimOverrideKind,
    pub file: String,
    pub line: u32,
}

static OPTIONS: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"black_atom_core_config(?:[^=]*[^=<>~!])?=(?:[^=]|$)").unwrap());

static OPTIONS_SET_CALL: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"black_atom_core_config.*set_?var|set_?var.*black_atom_core_config").unwrap()
});

static COLORSCHEME: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(concat!(
        r#"vim\.cmd\.colo(?:rscheme)?\s*\(?\s*["']([^"'\s]+)"#,
        r#"|vim\.cmd\(\s*(?:["']|\[=*\[)\s*colo(?:rscheme)?\s+([^"'\]\s]+)"#,
        r#"|^\s*:?\s*(?:silent!?\s+)?colo(?:rscheme)?\s+([^"'\s|]+)"#,
    ))
    .unwrap()
});

/// Overrides in `$XDG_CONFIG_HOME/nvim`. A missing or unreadable directory
/// yields none.
pub fn find_nvim_overrides() -> Vec<NvimOverride> {
    find_in(&paths::config_home().join("nvim"))
}

fn find_in(root: &Path) -> Vec<NvimOverride> {
    let mut found = Vec::new();
    let mut visited = HashSet::new();
    walk(root, &mut visited, &mut found);
    found
}

fn walk(dir: &Path, visited: &mut HashSet<PathBuf>, found: &mut Vec<NvimOverride>) {
    let Ok(canonical) = dir.canonicalize() else {
        return;
    };
    if !visited.insert(canonical) {
        return;
    }
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<PathBuf> = entries.filter_map(|e| e.ok()).map(|e| e.path()).collect();
    paths.sort();

    for path in paths {
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let Ok(meta) = fs::metadata(&path) else {
            continue;
        };
        if meta.is_dir() {
            if name != "colors" && !name.starts_with('.') {
                walk(&path, visited, found);
            }
        } else if let Some(comment) = comment_prefix(&path) {
            scan_file(&path, comment, found);
        }
    }
}

/// The line-comment marker of a `.lua` or `.vim` file, `None` for other files.
fn comment_prefix(path: &Path) -> Option<&'static str> {
    match path.extension()?.to_str()? {
        "lua" => Some("--"),
        "vim" => Some("\""),
        _ => None,
    }
}

fn scan_file(path: &Path, comment: &str, found: &mut Vec<NvimOverride>) {
    let Ok(text) = fs::read_to_string(path) else {
        return;
    };
    let file = path.display().to_string();
    for (index, line) in text.lines().enumerate() {
        if line.trim_start().starts_with(comment) {
            continue;
        }
        let kind = if OPTIONS.is_match(line) || OPTIONS_SET_CALL.is_match(line) {
            NvimOverrideKind::Options
        } else if COLORSCHEME.is_match(line) {
            NvimOverrideKind::Colorscheme
        } else {
            continue;
        };
        found.push(NvimOverride {
            kind,
            file: file.clone(),
            line: index as u32 + 1,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use NvimOverrideKind::{Colorscheme, Options};

    fn fixture() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/nvim-config")
    }

    fn summary(root: &Path, found: &[NvimOverride]) -> Vec<(NvimOverrideKind, String, u32)> {
        found
            .iter()
            .map(|o| {
                let relative = Path::new(&o.file).strip_prefix(root).unwrap();
                (o.kind, relative.display().to_string(), o.line)
            })
            .collect()
    }

    fn expected() -> Vec<(NvimOverrideKind, String, u32)> {
        vec![
            (Options, "init.lua".into(), 4),
            (Options, "init.lua".into(), 6),
            (Colorscheme, "init.lua".into(), 11),
            (Colorscheme, "init.lua".into(), 12),
            (Colorscheme, "init.lua".into(), 13),
            (Colorscheme, "init.lua".into(), 14),
            (Colorscheme, "init.lua".into(), 16),
            (Options, "plugin/legacy.vim".into(), 2),
            (Colorscheme, "plugin/legacy.vim".into(), 4),
            (Colorscheme, "plugin/legacy.vim".into(), 6),
        ]
    }

    #[test]
    fn finds_lua_and_vimscript_forms_and_skips_the_rest() {
        let root = fixture();
        assert_eq!(summary(&root, &find_in(&root)), expected());
    }

    #[test]
    fn follows_a_symlinked_config_dir() {
        let home = tempfile::tempdir().unwrap();
        let link = home.path().join("nvim");
        std::os::unix::fs::symlink(fixture(), &link).unwrap();
        assert_eq!(summary(&link, &find_in(&link)), expected());
    }

    #[test]
    fn survives_a_symlink_cycle() {
        let home = tempfile::tempdir().unwrap();
        let root = home.path().join("nvim");
        fs::create_dir_all(root.join("lua")).unwrap();
        fs::write(root.join("lua/a.lua"), "vim.cmd.colorscheme(\"x\")\n").unwrap();
        std::os::unix::fs::symlink(&root, root.join("lua/loop")).unwrap();
        let found = find_in(&root);
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].kind, Colorscheme);
    }

    #[test]
    fn finds_nothing_in_a_missing_or_clean_config() {
        let home = tempfile::tempdir().unwrap();
        assert!(find_in(&home.path().join("nvim")).is_empty());
        fs::write(home.path().join("init.lua"), "vim.opt.number = true\n").unwrap();
        assert!(find_in(home.path()).is_empty());
    }
}
