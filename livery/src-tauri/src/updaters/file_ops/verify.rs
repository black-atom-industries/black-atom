use std::path::PathBuf;

use regex::Regex;

/// Outcome of a config-path verification — does the file exist, and (for
/// pattern-patched adapters) does the configured match_pattern hit?
#[derive(Debug, PartialEq, Eq)]
pub struct PathVerification {
    pub exists: bool,
    /// `Some(hit)` when a match_pattern was checked; `None` when the adapter
    /// patches structurally (YAML/JSONC merge) and has no pattern to verify.
    pub pattern_matches: Option<bool>,
}

/// Check that `path` exists and — when `match_pattern` is given — that the
/// pattern (compiled in multiline mode, exactly like `patch_text_file`)
/// matches the file's content. Read-only counterpart to the patchers.
///
/// A missing file is a valid verification result (`exists: false`), not an
/// error; `Err` is reserved for unverifiable states (bad regex, unreadable
/// file) so the frontend can say so instead of showing a dead result.
pub fn verify_path(path: &str, match_pattern: Option<&str>) -> Result<PathVerification, String> {
    let expanded = shellexpand::tilde(path).to_string();

    if !PathBuf::from(&expanded).is_file() {
        return Ok(PathVerification {
            exists: false,
            pattern_matches: None,
        });
    }

    let Some(pattern) = match_pattern else {
        return Ok(PathVerification {
            exists: true,
            pattern_matches: None,
        });
    };

    let regex =
        Regex::new(&format!("(?m){pattern}")).map_err(|e| format!("Invalid regex pattern: {e}"))?;

    let content = std::fs::read_to_string(&expanded)
        .map_err(|e| format!("Failed to read {expanded}: {e}"))?;

    Ok(PathVerification {
        exists: true,
        pattern_matches: Some(regex.is_match(&content)),
    })
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
    fn test_existing_file_with_matching_pattern() {
        let file = copy_fixture_to_temp("text/ghostty-config.txt");
        let path = file.path().to_str().unwrap();

        let result = verify_path(path, Some(r"^theme\s*=\s*.+$")).unwrap();
        assert_eq!(
            result,
            PathVerification {
                exists: true,
                pattern_matches: Some(true),
            }
        );
    }

    #[test]
    fn test_existing_file_without_pattern_hit() {
        let file = copy_fixture_to_temp("text/ghostty-config.txt");
        let path = file.path().to_str().unwrap();

        let result = verify_path(path, Some(r"^nonexistent_key\s*=\s*.+$")).unwrap();
        assert_eq!(
            result,
            PathVerification {
                exists: true,
                pattern_matches: Some(false),
            }
        );
    }

    #[test]
    fn test_existing_file_with_no_pattern_configured() {
        let file = copy_fixture_to_temp("yaml/lazygit-config.yml");
        let path = file.path().to_str().unwrap();

        let result = verify_path(path, None).unwrap();
        assert_eq!(
            result,
            PathVerification {
                exists: true,
                pattern_matches: None,
            }
        );
    }

    #[test]
    fn test_missing_file_is_a_result_not_an_error() {
        let result = verify_path("~/definitely/not/here/livery-nope.conf", Some("^x$")).unwrap();
        assert_eq!(
            result,
            PathVerification {
                exists: false,
                pattern_matches: None,
            }
        );
    }

    #[test]
    fn test_invalid_regex_is_unverifiable() {
        let file = copy_fixture_to_temp("text/ghostty-config.txt");
        let path = file.path().to_str().unwrap();

        let result = verify_path(path, Some("([unclosed"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid regex pattern"));
    }
}
