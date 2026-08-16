use std::path::PathBuf;

use jsonc_parser::cst::CstRootNode;
use jsonc_parser::ParseOptions;

/// Set a string value at a key path in a JSONC file, preserving comments and formatting.
///
/// `key_path` supports dotted paths: `"theme"` for top-level, `"theme.dark"` for nested.
/// Leaf keys are created if missing. Parent keys in a dotted path must already exist.
pub fn patch_jsonc_file(path: String, key_path: &str, value: &str) -> Result<(), String> {
    // Restrict writes to files under $HOME
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let home = home.canonicalize().unwrap_or(home);
    let path = shellexpand::tilde(&path).to_string();
    let resolved = PathBuf::from(&path)
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path {path}: {e}"))?;
    if !resolved.starts_with(&home) {
        return Err(format!(
            "Path outside home directory is not allowed: {path}"
        ));
    }

    // Read file
    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {path}: {e}"))?;

    // Parse as JSONC CST
    let root = CstRootNode::parse(&content, &ParseOptions::default())
        .map_err(|e| format!("Failed to parse JSONC: {e}"))?;

    let root_obj = root
        .object_value()
        .ok_or_else(|| format!("JSONC root is not an object in {path}"))?;

    // Navigate key path (e.g., "theme" or "theme.dark")
    let parts: Vec<&str> = key_path.split('.').collect();

    if parts.first().is_none_or(|p| p.is_empty()) {
        return Err("Empty key path".to_string());
    }

    if parts.len() == 1 {
        // Top-level key
        set_string_value(&root_obj, parts[0], value)?;
    } else {
        // Nested key — navigate to parent object, then set the leaf
        let mut current_obj = root_obj;
        for &part in &parts[..parts.len() - 1] {
            let prop = current_obj
                .get(part)
                .ok_or_else(|| format!("Key '{part}' not found in {path}"))?;
            current_obj = prop
                .value()
                .and_then(|v| v.as_object())
                .ok_or_else(|| format!("Key '{part}' is not an object in {path}"))?;
        }
        let leaf_key = parts[parts.len() - 1];
        set_string_value(&current_obj, leaf_key, value)?;
    }

    // Direct write instead of atomic (tempfile + persist) because some apps
    // (e.g., Zed) watch the file inode and don't detect atomic renames.
    // Use resolved (not path) to write through symlinks rather than to the symlink path.
    std::fs::write(&resolved, root.to_string().as_bytes())
        .map_err(|e| format!("Failed to write {path}: {e}"))?;

    Ok(())
}

/// Set a string value on a key in a JSONC object. Creates the key if it doesn't exist.
fn set_string_value(
    obj: &jsonc_parser::cst::CstObject,
    key: &str,
    value: &str,
) -> Result<(), String> {
    match obj.get(key) {
        Some(prop) => {
            prop.set_value(jsonc_parser::cst::CstInputValue::String(value.to_string()));
        }
        None => {
            obj.append(
                key,
                jsonc_parser::cst::CstInputValue::String(value.to_string()),
            );
        }
    }
    Ok(())
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
    fn test_zed_flat_theme_replace() {
        let file = copy_fixture_to_temp("jsonc/zed-settings.jsonc");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "theme", "Black Atom — TERRA ∷ Spring Day").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("jsonc/zed-settings-expected.jsonc")).unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Zed flat theme mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_zed_object_theme_dark() {
        let file = copy_fixture_to_temp("jsonc/zed-settings-object.jsonc");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(
            path.clone(),
            "theme.dark",
            "Black Atom — TERRA ∷ Fall Night",
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path(
            "jsonc/zed-settings-object-dark-expected.jsonc",
        ))
        .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Zed object dark theme mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_zed_object_theme_light() {
        let file = copy_fixture_to_temp("jsonc/zed-settings-object.jsonc");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(
            path.clone(),
            "theme.light",
            "Black Atom — TERRA ∷ Spring Day",
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path(
            "jsonc/zed-settings-object-light-expected.jsonc",
        ))
        .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Zed object light theme mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_preserves_comments_and_trailing_commas() {
        let file = copy_fixture_to_temp("jsonc/zed-settings.jsonc");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "theme", "Black Atom — TERRA ∷ Spring Day").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();

        // Trailing commas preserved
        assert!(
            result.contains("\"vim_mode\": true,"),
            "Trailing comma after vim_mode should be preserved"
        );

        // Comments preserved
        assert!(
            result.contains("// User preferences"),
            "Comment should be preserved in output"
        );
    }

    #[test]
    fn test_zed_plain_json_theme_replace() {
        let file = copy_fixture_to_temp("jsonc/zed-settings-plain.json");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "theme", "Black Atom — TERRA ∷ Spring Day").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("jsonc/zed-settings-plain-expected.json"))
                .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Plain JSON theme mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_obsidian_appearance_dark() {
        let file = copy_fixture_to_temp("jsonc/obsidian-appearance.json");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "theme", "obsidian").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("jsonc/obsidian-appearance-dark-expected.json"))
                .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Obsidian appearance dark mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_obsidian_appearance_light() {
        let file = copy_fixture_to_temp("jsonc/obsidian-appearance.json");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "theme", "moonstone").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path(
            "jsonc/obsidian-appearance-light-expected.json",
        ))
        .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Obsidian appearance light mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_obsidian_style_settings_dark_variant() {
        let file = copy_fixture_to_temp("jsonc/obsidian-style-settings.json");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(
            path.clone(),
            "black-atom-variants@@dark-theme-variant",
            "black-atom-jpn-murasaki-yoru",
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path(
            "jsonc/obsidian-style-settings-dark-expected.json",
        ))
        .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Obsidian style settings dark mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_obsidian_style_settings_light_variant() {
        let file = copy_fixture_to_temp("jsonc/obsidian-style-settings.json");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(
            path.clone(),
            "black-atom-variants@@light-theme-variant",
            "black-atom-terra-spring-day",
        )
        .unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        let expected = std::fs::read_to_string(fixture_path(
            "jsonc/obsidian-style-settings-light-expected.json",
        ))
        .unwrap();
        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Obsidian style settings light mismatch.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_missing_key_is_created() {
        let file = copy_fixture_to_temp("jsonc/zed-settings.jsonc");
        let path = file.path().to_str().unwrap().to_string();

        patch_jsonc_file(path.clone(), "nonexistent_key", "new_value").unwrap();

        let result = std::fs::read_to_string(&path).unwrap();
        assert!(
            result.contains("\"nonexistent_key\": \"new_value\""),
            "Missing key should be created"
        );
    }

    #[test]
    fn test_path_outside_home() {
        let result = patch_jsonc_file("/etc/settings.jsonc".to_string(), "theme", "value");
        assert!(result.is_err());
    }
}
