use std::collections::HashMap;

use regex::Regex;

use super::secure::{atomic_write, resolve_home_file};

/// Read a file, apply regex replacement with template variables, and write it back.
/// Variables are rendered into the replace_template before replacement.
/// Supported variable placeholders: {themeKey}, {appearance}, {collectionKey}, {themesPath}
pub fn patch_text_file(
    path: String,
    match_pattern: String,
    replace_template: String,
    variables: HashMap<String, String>,
) -> Result<(), String> {
    let (path, resolved) = resolve_home_file(&path)?;

    // Read file
    let content =
        std::fs::read_to_string(&resolved).map_err(|e| format!("Failed to read {path}: {e}"))?;

    // Compile regex with multiline mode
    let regex = Regex::new(&format!("(?m){match_pattern}"))
        .map_err(|e| format!("Invalid regex pattern: {e}"))?;

    // Check pattern exists in content
    if !regex.is_match(&content) {
        return Err(format!("Pattern not found in {path}: {match_pattern}"));
    }

    // Render template with variables
    let mut rendered = replace_template.clone();
    for (key, value) in &variables {
        let placeholder = format!("{{{key}}}");
        rendered = rendered.replace(&placeholder, value);
    }

    // Validate no unreplaced placeholders remain
    let re_placeholder = Regex::new(r"\{[a-zA-Z]+\}").unwrap();
    if re_placeholder.is_match(&rendered) {
        let missing: Vec<&str> = re_placeholder
            .find_iter(&rendered)
            .map(|m| m.as_str())
            .collect();
        return Err(format!(
            "Unreplaced placeholders in template: {}",
            missing.join(", ")
        ));
    }

    // Replace first match only
    let updated = regex.replace(&content, rendered.as_str()).to_string();

    atomic_write(&resolved, &path, &updated)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::path::PathBuf;

    fn fixture_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join(name)
    }

    fn copy_fixture_to_temp(fixture_name: &str) -> tempfile::NamedTempFile {
        let content = std::fs::read_to_string(fixture_path(fixture_name)).unwrap();
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
        file.write_all(content.as_bytes()).unwrap();
        file
    }

    #[test]
    fn test_ghostty_theme_replace() {
        let file = copy_fixture_to_temp("text/ghostty-config.txt");
        let path = file.path().to_str().unwrap().to_string();
        let mut vars = HashMap::new();
        vars.insert(
            "themeKey".to_string(),
            "black-atom-terra-spring-day".to_string(),
        );

        patch_text_file(
            path.clone(),
            r"^theme\s*=\s*.+$".to_string(),
            "theme = {themeKey}.conf".to_string(),
            vars,
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("text/ghostty-config-expected.txt")).unwrap();
        assert_eq!(
            result, expected,
            "Ghostty config mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_nvim_colorscheme_replace() {
        let file = copy_fixture_to_temp("text/nvim-config.lua");
        let path = file.path().to_str().unwrap().to_string();
        let mut vars = HashMap::new();
        vars.insert(
            "themeKey".to_string(),
            "black-atom-terra-spring-day".to_string(),
        );

        patch_text_file(
            path.clone(),
            r#"colorscheme\s*=\s*"[^"]*""#.to_string(),
            "colorscheme = \"{themeKey}\"".to_string(),
            vars,
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("text/nvim-config-expected.lua")).unwrap();
        assert_eq!(
            result, expected,
            "Nvim config mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_tmux_source_file_replace() {
        let file = copy_fixture_to_temp("text/tmux.conf");
        let path = file.path().to_str().unwrap().to_string();
        let mut vars = HashMap::new();
        vars.insert(
            "themeKey".to_string(),
            "black-atom-jpn-koyo-yoru".to_string(),
        );
        vars.insert("collectionKey".to_string(), "jpn".to_string());
        vars.insert("themesPath".to_string(), "~/themes".to_string());

        patch_text_file(
            path.clone(),
            r"^source-file\s+.+/themes/.+\.conf$".to_string(),
            "source-file {themesPath}/{collectionKey}/{themeKey}.conf".to_string(),
            vars,
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path("text/tmux-expected.conf")).unwrap();
        assert_eq!(
            result, expected,
            "Tmux config mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_delta_appearance_replace() {
        let file = copy_fixture_to_temp("text/delta-config.ini");
        let path = file.path().to_str().unwrap().to_string();
        let mut vars = HashMap::new();
        vars.insert("appearance".to_string(), "light".to_string());

        patch_text_file(
            path.clone(),
            r"features\s*=\s*black-atom-(dark|light)".to_string(),
            "features = black-atom-{appearance}".to_string(),
            vars,
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("text/delta-config-expected.ini")).unwrap();
        assert_eq!(
            result, expected,
            "Delta config mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_nvim_vimcmd_colorscheme_replace() {
        let target = copy_fixture_to_temp("text/nvim-config-vimcmd.lua");
        let target_path = target.path().to_str().unwrap().to_string();
        let mut vars = HashMap::new();
        vars.insert(
            "themeKey".to_string(),
            "black-atom-terra-spring-day".to_string(),
        );

        patch_text_file(
            target_path.clone(),
            r#"vim\.cmd\.colorscheme\("[^"]*"\)"#.to_string(),
            r#"vim.cmd.colorscheme("{themeKey}")"#.to_string(),
            vars,
        )
        .unwrap();

        let result = std::fs::read_to_string(&target_path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("text/nvim-config-vimcmd-expected.lua")).unwrap();
        assert_eq!(result.trim_end(), expected.trim_end());
    }

    #[test]
    fn test_pattern_not_found_returns_error() {
        let file = copy_fixture_to_temp("text/ghostty-config.txt");
        let path = file.path().to_str().unwrap().to_string();
        let vars = HashMap::new();

        let result = patch_text_file(
            path,
            r"^nonexistent_pattern\s*=\s*.+$".to_string(),
            "replacement".to_string(),
            vars,
        );

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Pattern not found"));
    }
}
