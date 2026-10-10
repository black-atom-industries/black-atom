//! Kagi custom CSS files. Each file holds a theme's light and dark variant, so
//! a theme key resolves to its file by dropping the appearance suffix.

use include_dir::File;

use super::embedded::{embedded, Adapter};

fn files() -> impl Iterator<Item = &'static File<'static>> {
    embedded(Adapter::Kagi)
        .into_iter()
        .flat_map(|(_, dir)| dir.dirs())
        .flat_map(|collection| collection.files())
        .filter(|file| file.path().extension().is_some_and(|ext| ext == "css"))
}

fn stem<'a>(file: &'a File<'static>) -> &'a str {
    file.path()
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or_default()
}

/// File stems such as `black-atom-minium-polymer`, sorted.
pub fn names() -> Vec<&'static str> {
    let mut names: Vec<&str> = files().map(stem).collect();
    names.sort_unstable();
    names
}

/// The Kagi file name a theme key refers to: the key without its appearance suffix.
pub fn name_for(key: &str) -> &str {
    key.strip_suffix("-dark")
        .or_else(|| key.strip_suffix("-light"))
        .unwrap_or(key)
}

/// The CSS for a Kagi file name or any theme key.
pub fn css(input: &str) -> Result<&'static str, String> {
    let name = name_for(input);
    files()
        .find(|file| stem(file) == input || stem(file) == name)
        .and_then(|file| file.contents_utf8())
        .ok_or_else(|| format!("no Kagi theme '{input}' — run `livery adapter kagi` to pick one"))
}

/// Puts `font` first in both font stacks, moving it there when a stack already
/// lists it. A blank font leaves the CSS unchanged.
pub fn with_font(css: &str, font: &str) -> String {
    let font = font.trim().replace('"', "");
    if font.is_empty() {
        return css.to_string();
    }
    ["--ba-font: ", "--ba-font-heading: "]
        .iter()
        .fold(css.to_string(), |css, property| {
            let Some(start) = css.find(property).map(|at| at + property.len()) else {
                return css;
            };
            let Some(end) = css[start..].find(';').map(|at| start + at) else {
                return css;
            };
            let stack = std::iter::once(format!("\"{font}\""))
                .chain(
                    css[start..end]
                        .split(',')
                        .map(str::trim)
                        .filter(|entry| !entry.trim_matches('"').eq_ignore_ascii_case(&font))
                        .map(str::to_string),
                )
                .collect::<Vec<_>>()
                .join(", ");
            format!("{}{stack}{}", &css[..start], &css[end..])
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lists_every_file_sorted() {
        let names = names();
        assert_eq!(names.len(), 17);
        let mut sorted = names.clone();
        sorted.sort_unstable();
        assert_eq!(names, sorted);
    }

    #[test]
    fn resolves_a_pair_name() {
        let css = css("black-atom-minium-polymer").unwrap();
        assert!(css.contains("Minium ∷ Polymer Light"));
        assert!(css.contains("Minium ∷ Polymer Dark"));
    }

    #[test]
    fn dark_and_light_keys_share_a_file() {
        let dark = css("black-atom-minium-polymer-dark").unwrap();
        let light = css("black-atom-minium-polymer-light").unwrap();
        assert_eq!(dark, light);
        assert_eq!(dark, css("black-atom-minium-polymer").unwrap());
    }

    #[test]
    fn dark_only_key_resolves() {
        let css = css("black-atom-jpn-murasaki-dark").unwrap();
        assert!(css.contains("Murasaki"));
    }

    #[test]
    fn unknown_name_errors_with_the_input() {
        assert!(css("nope").unwrap_err().contains("'nope'"));
    }

    fn stack<'a>(css: &'a str, property: &str) -> &'a str {
        css.lines()
            .find_map(|line| line.trim_start().strip_prefix(property))
            .unwrap()
    }

    #[test]
    fn font_leads_both_stacks() {
        let css = css("black-atom-minium-polymer").unwrap();
        let out = with_font(css, "JetBrains Mono");
        assert!(stack(&out, "--ba-font: ").starts_with("\"JetBrains Mono\", "));
        assert!(stack(&out, "--ba-font-heading: ").starts_with("\"JetBrains Mono\", "));
    }

    #[test]
    fn blank_font_changes_nothing() {
        let css = css("black-atom-minium-polymer").unwrap();
        assert_eq!(with_font(css, ""), css);
        assert_eq!(with_font(css, "  \t "), css);
        assert_eq!(with_font(css, "\"\""), css);
    }

    #[test]
    fn font_quotes_are_stripped() {
        let css = css("black-atom-minium-polymer").unwrap();
        let out = with_font(css, " \"Fira Code\" ");
        assert!(stack(&out, "--ba-font: ").starts_with("\"Fira Code\", "));
    }

    #[test]
    fn a_listed_font_moves_to_the_front_once() {
        let css = css("black-atom-minium-polymer").unwrap();
        for font in ["TX-02 Condensed", "tx-02 condensed"] {
            let out = with_font(css, font);
            for property in ["--ba-font: ", "--ba-font-heading: "] {
                let stack = stack(&out, property);
                assert!(stack.starts_with(&format!("\"{font}\", ")), "{stack}");
                assert_eq!(
                    stack.to_lowercase().matches("\"tx-02 condensed\"").count(),
                    1
                );
            }
        }
        assert_eq!(
            with_font(&with_font(css, "Fira Code"), "Fira Code"),
            with_font(css, "Fira Code")
        );
    }

    #[test]
    fn only_the_two_stacks_change() {
        let css = css("black-atom-minium-polymer").unwrap();
        let font = "JetBrains Mono";
        assert_eq!(with_font(css, font).len(), css.len() + 2 * (font.len() + 4));
    }
}
