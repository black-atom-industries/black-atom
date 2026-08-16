use std::io::Write;
use std::path::PathBuf;
use std::str::FromStr;

use yaml_edit::YamlFile;

/// Read a source YAML file, merge it into a target YAML file losslessly
/// (preserving comments and formatting), and write the result back.
///
/// Merge semantics:
/// - Mapping + Mapping → recurse, overlay keys win
/// - Anything else → overlay replaces target entirely
pub fn patch_yaml_file(target_path: String, source_path: String) -> Result<(), String> {
    // Expand tildes and restrict both paths to files under $HOME
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let home = home.canonicalize().unwrap_or(home);
    let target_path = shellexpand::tilde(&target_path).to_string();
    let source_path = shellexpand::tilde(&source_path).to_string();

    let resolved_target = PathBuf::from(&target_path)
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path {target_path}: {e}"))?;
    if !resolved_target.starts_with(&home) {
        return Err(format!(
            "Path outside home directory is not allowed: {target_path}"
        ));
    }

    let resolved_source = PathBuf::from(&source_path)
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path {source_path}: {e}"))?;
    if !resolved_source.starts_with(&home) {
        return Err(format!(
            "Path outside home directory is not allowed: {source_path}"
        ));
    }

    // Read source file and parse with yaml_serde (for structural walk decisions)
    let source_content = std::fs::read_to_string(&source_path)
        .map_err(|e| format!("Failed to read {source_path}: {e}"))?;
    let overlay: yaml_serde::Value = yaml_serde::from_str(&source_content)
        .map_err(|e| format!("Failed to parse source YAML: {e}"))?;

    // Also parse source with yaml_edit (to extract properly-typed nodes)
    let source_file = YamlFile::from_str(&source_content)
        .map_err(|e| format!("Failed to parse source YAML with yaml_edit: {e}"))?;
    let source_doc = source_file
        .documents()
        .next()
        .ok_or("Source YAML has no documents")?;
    let source_mapping = source_doc
        .as_mapping()
        .ok_or("Source YAML root is not a mapping")?;

    // Read target file and parse with yaml_edit (lossless, using YamlFile to preserve
    // top-level comments that Document::from_str drops)
    let target_content = std::fs::read_to_string(&target_path)
        .map_err(|e| format!("Failed to read {target_path}: {e}"))?;
    let target_file = YamlFile::from_str(&target_content)
        .map_err(|e| format!("Failed to parse target YAML: {e}"))?;
    let target_doc = target_file
        .documents()
        .next()
        .ok_or("Target YAML has no documents")?;
    let target_mapping = target_doc
        .as_mapping()
        .ok_or("Target YAML root is not a mapping")?;

    // Apply overlay — yaml_edit handles all value types including block sequences
    apply_overlay(&target_mapping, &source_mapping, &overlay)?;

    // Atomic write: temp file + persist
    // Use resolved_target (not target_path) so rename() writes through symlinks
    // rather than replacing the symlink itself with a new regular file.
    let parent = resolved_target
        .parent()
        .ok_or_else(|| format!("No parent directory for {target_path}"))?;
    let mut tmp = tempfile::NamedTempFile::new_in(parent)
        .map_err(|e| format!("Failed to create temp file: {e}"))?;
    tmp.write_all(target_file.to_string().as_bytes())
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    tmp.persist(&resolved_target)
        .map_err(|e| format!("Failed to persist to {target_path}: {e}"))?;

    Ok(())
}

/// Recursively apply overlay values onto a target mapping.
///
/// Uses yaml_serde for structure decisions (is this a mapping?) and
/// yaml_edit nodes for the actual values (preserves types, quoting, formatting).
fn apply_overlay(
    target_mapping: &yaml_edit::Mapping,
    source_mapping: &yaml_edit::Mapping,
    overlay: &yaml_serde::Value,
) -> Result<(), String> {
    let overlay_map = match overlay {
        yaml_serde::Value::Mapping(m) => m,
        _ => return Err("Overlay root must be a mapping".to_string()),
    };

    for (key, value) in overlay_map {
        let key_str = key
            .as_str()
            .ok_or_else(|| format!("Non-string key in overlay: {:?}", key))?;

        // If both sides are mappings, recurse
        if let yaml_serde::Value::Mapping(_) = value {
            if let Some(target_sub) = target_mapping.get_mapping(key_str) {
                if let Some(source_sub) = source_mapping.get_mapping(key_str) {
                    apply_overlay(&target_sub, &source_sub, value)?;
                    continue;
                }
            }
        }

        // For all value types (scalars, sequences, mappings), use set_value on
        // existing entries to preserve surrounding whitespace/comments, or set()
        // for new entries.
        let source_node = source_mapping
            .get(key_str)
            .ok_or_else(|| format!("Key '{key_str}' missing in source yaml_edit tree"))?;

        if let Some(entry) = target_mapping.find_entry_by_key(key_str) {
            entry.set_value(&source_node, false);
        } else {
            target_mapping.set(key_str, &source_node);
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

    fn make_temp_file(content: &str) -> tempfile::NamedTempFile {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
        file.write_all(content.as_bytes()).unwrap();
        file
    }

    #[test]
    fn test_lazygit_theme_merge() {
        let target = copy_fixture_to_temp("yaml/lazygit-config.yml");
        let source = copy_fixture_to_temp("yaml/lazygit-theme-source.yml");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        patch_yaml_file(target_path.clone(), source_path).unwrap();

        let result = std::fs::read_to_string(&target_path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("yaml/lazygit-config-expected.yml")).unwrap();

        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Merged output does not match expected fixture.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );

        // Verify the result is valid YAML that can be parsed
        let parsed: Result<yaml_serde::Value, _> = yaml_serde::from_str(&result);
        assert!(
            parsed.is_ok(),
            "Merged output is not valid YAML: {:?}",
            parsed.err()
        );
    }

    #[test]
    fn test_simple_scalar_merge() {
        let target = copy_fixture_to_temp("yaml/simple-config.yml");
        let source = copy_fixture_to_temp("yaml/simple-overlay.yml");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        patch_yaml_file(target_path.clone(), source_path).unwrap();

        let result = std::fs::read_to_string(&target_path).unwrap();
        let expected =
            std::fs::read_to_string(fixture_path("yaml/simple-config-expected.yml")).unwrap();

        assert_eq!(
            result.trim_end(),
            expected.trim_end(),
            "Simple merge output does not match expected.\n\n--- ACTUAL ---\n{result}\n--- EXPECTED ---\n{expected}"
        );
    }

    #[test]
    fn test_merge_preserves_comments() {
        let target = copy_fixture_to_temp("yaml/lazygit-config.yml");
        let source = copy_fixture_to_temp("yaml/lazygit-theme-source.yml");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        patch_yaml_file(target_path.clone(), source_path).unwrap();

        let result = std::fs::read_to_string(&target_path).unwrap();

        assert!(
            result.contains("# Theme colors managed by pick-theme"),
            "Section comment should survive: {result}"
        );
        assert!(
            result.contains("# stuff relating to the UI"),
            "UI comment should survive: {result}"
        );
        assert!(
            result.contains("# yaml-language-server"),
            "Header comment should survive: {result}"
        );
        assert!(
            result.contains("# how many lines you scroll by"),
            "Inline comment should survive: {result}"
        );
    }

    #[test]
    fn test_merge_preserves_untouched_sections() {
        let target = copy_fixture_to_temp("yaml/lazygit-config.yml");
        let source = copy_fixture_to_temp("yaml/lazygit-theme-source.yml");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        patch_yaml_file(target_path.clone(), source_path).unwrap();

        let result = std::fs::read_to_string(&target_path).unwrap();

        assert!(
            result.contains("autoFetch: true"),
            "git.autoFetch should be preserved: {result}"
        );
        assert!(
            result.contains("mainBranches: [master, main]"),
            "git.mainBranches should be preserved: {result}"
        );
        assert!(
            result.contains("confirmOnQuit: false"),
            "confirmOnQuit should be preserved: {result}"
        );
        assert!(
            result.contains("open: \"zed {{filename}}\""),
            "os.open should be preserved: {result}"
        );
        assert!(
            result.contains("editInTerminal: false"),
            "os.editInTerminal should be preserved: {result}"
        );
        assert!(
            result.contains("branchColors:"),
            "branchColors should be preserved: {result}"
        );
    }

    #[test]
    fn test_target_not_found() {
        let home = dirs::home_dir().unwrap();
        let target_path = home
            .join("nonexistent_yaml_target_12345.yml")
            .to_str()
            .unwrap()
            .to_string();
        let source = make_temp_file("key: value\n");
        let source_path = source.path().to_str().unwrap().to_string();

        let result = patch_yaml_file(target_path, source_path);
        assert!(result.is_err());
    }

    #[test]
    fn test_source_not_found() {
        let home = dirs::home_dir().unwrap();
        let target = make_temp_file("key: value\n");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = home
            .join("nonexistent_yaml_source_12345.yml")
            .to_str()
            .unwrap()
            .to_string();

        let result = patch_yaml_file(target_path, source_path);
        assert!(result.is_err());
    }

    #[test]
    fn test_target_outside_home() {
        let source = make_temp_file("key: value\n");
        let source_path = source.path().to_str().unwrap().to_string();

        let result = patch_yaml_file("/etc/hosts".to_string(), source_path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("outside home directory"));
    }

    #[test]
    fn test_source_outside_home() {
        let target = make_temp_file("key: value\n");
        let target_path = target.path().to_str().unwrap().to_string();

        let result = patch_yaml_file(target_path, "/etc/hosts".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("outside home directory"));
    }

    #[test]
    fn test_merge_is_idempotent() {
        let target = copy_fixture_to_temp("yaml/lazygit-config.yml");
        let source = copy_fixture_to_temp("yaml/lazygit-theme-source.yml");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        // Apply once
        patch_yaml_file(target_path.clone(), source_path.clone()).unwrap();
        let after_first = std::fs::read_to_string(&target_path).unwrap();

        // Apply again
        patch_yaml_file(target_path.clone(), source_path).unwrap();
        let after_second = std::fs::read_to_string(&target_path).unwrap();

        assert_eq!(
            after_first, after_second,
            "Applying the merge twice should produce the same result.\n\n--- FIRST ---\n{after_first}\n--- SECOND ---\n{after_second}"
        );
    }

    #[test]
    fn test_invalid_yaml_source() {
        let target = make_temp_file("key: value\n");
        let source = make_temp_file("not: valid: yaml: [[[\n");
        let target_path = target.path().to_str().unwrap().to_string();
        let source_path = source.path().to_str().unwrap().to_string();

        let result = patch_yaml_file(target_path, source_path);
        assert!(result.is_err());
    }
}
