//! The theme catalogue, read out of the embedded tmux adapter.
//!
//! The GUI gets its themes from `@black-atom/core` over the Tauri bridge, so
//! a Rust caller without a frontend needs its own source. Every generated
//! tmux theme carries a `# Theme:` / `# Appearance:` / `# Collection:`
//! header, which is the only embedded output that names a theme's appearance
//! — the other adapters emit colors alone.

use super::embedded::{self, Adapter};

/// One theme as `update_app` needs it: the key it is applied by, plus the
/// metadata the updaters render into config lines.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ThemeEntry {
    /// `black-atom-jpn-koyo-yoru` — the file stem every adapter names its
    /// output by.
    pub key: String,
    /// The collection directory the theme is generated into: `jpn`, `terra`,
    /// and so on.
    pub collection_key: String,
    /// `dark` or `light`.
    pub appearance: String,
    /// `Black Atom — JPN ∷ Koyo Yoru`.
    pub label: String,
}

/// Every embedded theme, sorted by collection then key.
pub fn themes() -> Vec<ThemeEntry> {
    let mut entries = Vec::new();
    for (_, dir) in embedded::embedded(Adapter::Tmux) {
        for collection in dir.dirs() {
            let Some(collection_key) = collection
                .path()
                .file_name()
                .and_then(|name| name.to_str())
                .map(str::to_string)
            else {
                continue;
            };
            for file in collection.files() {
                let path = file.path();
                let Some(key) = path.file_stem().and_then(|stem| stem.to_str()) else {
                    continue;
                };
                if !key.starts_with("black-atom-") {
                    continue;
                }
                let Some(contents) = file.contents_utf8() else {
                    continue;
                };
                entries.push(ThemeEntry {
                    key: key.to_string(),
                    collection_key: collection_key.clone(),
                    appearance: header(contents, "Appearance").unwrap_or("dark").to_string(),
                    label: header(contents, "Theme").unwrap_or(key).to_string(),
                });
            }
        }
    }
    entries.sort_by(|a, b| {
        a.collection_key
            .cmp(&b.collection_key)
            .then_with(|| a.key.cmp(&b.key))
    });
    entries
}

/// Look one theme up by key.
pub fn find(key: &str) -> Option<ThemeEntry> {
    themes().into_iter().find(|theme| theme.key == key)
}

/// The value of a `# <field>: <value>` header line in a generated theme file.
fn header<'a>(contents: &'a str, field: &str) -> Option<&'a str> {
    let prefix = format!("# {field}:");
    contents
        .lines()
        .take_while(|line| line.starts_with('#') || line.trim().is_empty())
        .find_map(|line| line.strip_prefix(&prefix))
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    const COLLECTIONS: [&str; 6] = ["default", "jpn", "mnml", "paper", "stations", "terra"];

    #[test]
    fn test_every_embedded_theme_parses_a_complete_entry() {
        let themes = themes();
        assert!(themes.len() >= 30, "got {} themes", themes.len());

        for theme in &themes {
            assert!(theme.key.starts_with("black-atom-"), "{}", theme.key);
            assert!(
                COLLECTIONS.contains(&theme.collection_key.as_str()),
                "{} has an unknown collection {}",
                theme.key,
                theme.collection_key
            );
            assert!(
                theme.appearance == "dark" || theme.appearance == "light",
                "{} has appearance {}",
                theme.key,
                theme.appearance
            );
            assert!(
                theme.label.starts_with("Black Atom"),
                "{} has label {}",
                theme.key,
                theme.label
            );
        }
    }

    #[test]
    fn test_collection_key_is_the_directory_not_the_header() {
        let koyo = find("black-atom-jpn-koyo-yoru").expect("jpn koyo yoru is embedded");
        assert_eq!(koyo.collection_key, "jpn");
        assert_eq!(koyo.appearance, "dark");
        assert_eq!(koyo.label, "Black Atom — JPN ∷ Koyo Yoru");

        let hiru = find("black-atom-jpn-koyo-hiru").expect("jpn koyo hiru is embedded");
        assert_eq!(hiru.appearance, "light");
    }

    #[test]
    fn test_keys_are_unique_and_unknown_keys_miss() {
        let themes = themes();
        let mut keys: Vec<&str> = themes.iter().map(|t| t.key.as_str()).collect();
        keys.sort_unstable();
        let count = keys.len();
        keys.dedup();
        assert_eq!(keys.len(), count, "theme keys must be unique");

        assert!(find("not-a-theme").is_none());
    }
}
