use regex::Regex;

use super::secure::{atomic_write, resolve_home_file};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ManagedBlockUpdate {
    pub changed: bool,
    pub appended: bool,
}

/// Markers and the format checks one managed-block format needs. `conflicting_table_pattern`
/// guards the append path against an unmanaged live stanza; formats without that hazard pass
/// `None`.
pub struct ManagedBlock<'a> {
    pub begin_marker: &'a str,
    pub end_marker: &'a str,
    pub conflicting_table_pattern: Option<&'a str>,
    /// Format check for the replacement fragment on its own.
    pub validate_fragment: &'a dyn Fn(&str) -> Result<(), String>,
    /// Format check for the whole file as it would be written.
    pub validate_file: &'a dyn Fn(&str) -> Result<(), String>,
}

/// Replace one marked block, or append it when the target has neither markers nor a conflicting
/// live table. The fragment and the complete candidate go through the format's validators before
/// any write.
pub fn patch_managed_block_file(
    path: String,
    replacement: &str,
    block: &ManagedBlock,
) -> Result<ManagedBlockUpdate, String> {
    check_marker_span(replacement, block.begin_marker, block.end_marker)?;
    (block.validate_fragment)(replacement)?;

    let (display_path, resolved) = resolve_home_file(&path)?;
    let content = std::fs::read_to_string(&resolved)
        .map_err(|e| format!("Failed to read {display_path}: {e}"))?;
    let (updated, appended) = build_candidate(
        &content,
        replacement,
        block.begin_marker,
        block.end_marker,
        block.conflicting_table_pattern,
    )?;

    (block.validate_file)(&updated).map_err(|e| format!("{e} ({display_path})"))?;

    if updated == content {
        return Ok(ManagedBlockUpdate {
            changed: false,
            appended,
        });
    }

    atomic_write(&resolved, &display_path, &updated)?;
    Ok(ManagedBlockUpdate {
        changed: true,
        appended,
    })
}

/// Replace or append a TOML managed block. Fragment and result are parsed as TOML before any
/// write.
pub fn patch_toml_managed_block_file(
    path: String,
    replacement: &str,
    begin_marker: &str,
    end_marker: &str,
    conflicting_table_pattern: &str,
) -> Result<ManagedBlockUpdate, String> {
    patch_managed_block_file(
        path,
        replacement,
        &ManagedBlock {
            begin_marker,
            end_marker,
            conflicting_table_pattern: Some(conflicting_table_pattern),
            validate_fragment: &|fragment| {
                toml::from_str::<toml::Value>(fragment)
                    .map(|_| ())
                    .map_err(|e| format!("Invalid managed theme fragment TOML: {e}"))
            },
            validate_file: &|candidate| {
                toml::from_str::<toml::Value>(candidate)
                    .map(|_| ())
                    .map_err(|e| format!("Managed theme would make the file invalid TOML: {e}"))
            },
        },
    )
}

fn check_marker_span(
    replacement: &str,
    begin_marker: &str,
    end_marker: &str,
) -> Result<(), String> {
    let (begin, end) = unique_marker_span(replacement, begin_marker, end_marker)
        .map_err(|e| format!("Invalid managed theme fragment: {e}"))?;
    if begin >= end {
        return Err("Invalid managed theme fragment: end marker precedes begin marker".to_string());
    }
    Ok(())
}

fn build_candidate(
    content: &str,
    replacement: &str,
    begin_marker: &str,
    end_marker: &str,
    conflicting_table_pattern: Option<&str>,
) -> Result<(String, bool), String> {
    let begin_lines = marker_lines(content, begin_marker);
    let end_lines = marker_lines(content, end_marker);

    match (begin_lines.as_slice(), end_lines.as_slice()) {
        ([], []) => {
            if let Some(pattern) = conflicting_table_pattern {
                let conflicts = Regex::new(&format!("(?m){pattern}"))
                    .map_err(|e| format!("Invalid conflicting table pattern: {e}"))?;
                if conflicts.is_match(content) {
                    return Err(
                        "No managed markers found, but an unmanaged [theme] or [theme.custom] table exists; wrap the existing theme stanza with the Livery markers before applying"
                            .to_string(),
                    );
                }
            }
            Ok((append_block(content, replacement), true))
        }
        ([begin], [end]) if begin.start < end.start => {
            let replacement = replacement.trim_end_matches(['\r', '\n']);
            let mut updated = String::with_capacity(
                content.len() - (end.end - begin.start) + replacement.len() + 1,
            );
            updated.push_str(&content[..begin.start]);
            updated.push_str(replacement);
            if end.had_newline {
                updated.push('\n');
            }
            updated.push_str(&content[end.end..]);
            Ok((updated, false))
        }
        ([..], [..]) if begin_lines.len() != 1 || end_lines.len() != 1 => Err(format!(
            "Ambiguous managed markers: found {} begin marker(s) and {} end marker(s)",
            begin_lines.len(),
            end_lines.len()
        )),
        _ => Err("Malformed managed markers: end marker precedes begin marker".to_string()),
    }
}

fn append_block(content: &str, replacement: &str) -> String {
    let replacement = replacement.trim_end_matches(['\r', '\n']);
    if content.is_empty() {
        return format!("{replacement}\n");
    }

    let separator = if content.ends_with("\n\n") {
        ""
    } else if content.ends_with('\n') {
        "\n"
    } else {
        "\n\n"
    };
    format!("{content}{separator}{replacement}\n")
}

#[derive(Debug, Clone, Copy)]
struct MarkerLine {
    start: usize,
    end: usize,
    had_newline: bool,
}

fn unique_marker_span(
    content: &str,
    begin_marker: &str,
    end_marker: &str,
) -> Result<(usize, usize), String> {
    let begins = marker_lines(content, begin_marker);
    let ends = marker_lines(content, end_marker);
    if begins.len() != 1 || ends.len() != 1 {
        return Err(format!(
            "expected exactly one marker pair, found {} begin marker(s) and {} end marker(s)",
            begins.len(),
            ends.len()
        ));
    }
    Ok((begins[0].start, ends[0].start))
}

fn marker_lines(content: &str, marker: &str) -> Vec<MarkerLine> {
    let mut lines = Vec::new();
    let mut offset = 0;
    for raw in content.split_inclusive('\n') {
        let had_newline = raw.ends_with('\n');
        let line = raw.trim_end_matches(['\r', '\n']);
        let end = offset + raw.len();
        if line.trim() == marker {
            lines.push(MarkerLine {
                start: offset,
                end,
                had_newline,
            });
        }
        offset = end;
    }
    lines
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::path::PathBuf;

    const BEGIN: &str = "# BEGIN BLACK ATOM LIVERY THEME";
    const END: &str = "# END BLACK ATOM LIVERY THEME";
    const CONFLICTS: &str = r"^\s*\[(?:theme|theme\.custom)\]\s*(?:#.*)?$";

    fn fixture_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join(name)
    }

    fn fixture(name: &str) -> String {
        std::fs::read_to_string(fixture_path(name)).unwrap()
    }

    fn copy_fixture_to_temp(name: &str) -> tempfile::NamedTempFile {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
        file.write_all(fixture(name).as_bytes()).unwrap();
        file
    }

    fn apply(path: String, replacement: &str) -> Result<ManagedBlockUpdate, String> {
        patch_toml_managed_block_file(path, replacement, BEGIN, END, CONFLICTS)
    }

    #[test]
    fn replaces_realistic_config_and_preserves_everything_else() {
        let file = copy_fixture_to_temp("text/herdr-config.toml");
        let path = file.path().to_string_lossy().to_string();
        let replacement = fixture("themes/herdr-theme.toml");

        let result = apply(path.clone(), &replacement).unwrap();
        assert!(result.changed);
        assert!(!result.appended);
        assert_eq!(
            std::fs::read_to_string(path).unwrap(),
            fixture("text/herdr-config-expected.toml")
        );
    }

    #[test]
    fn applying_twice_is_idempotent() {
        let file = copy_fixture_to_temp("text/herdr-config.toml");
        let path = file.path().to_string_lossy().to_string();
        let replacement = fixture("themes/herdr-theme.toml");

        apply(path.clone(), &replacement).unwrap();
        let once = std::fs::read_to_string(&path).unwrap();
        let second = apply(path.clone(), &replacement).unwrap();
        let twice = std::fs::read_to_string(path).unwrap();

        assert!(!second.changed);
        assert_eq!(once, twice);
    }

    #[test]
    fn appends_when_no_markers_or_theme_table_exist() {
        let file = copy_fixture_to_temp("text/herdr-config-without-theme.toml");
        let path = file.path().to_string_lossy().to_string();
        let replacement = fixture("themes/herdr-theme.toml");

        let result = apply(path.clone(), &replacement).unwrap();
        assert!(result.appended);
        assert_eq!(
            std::fs::read_to_string(path).unwrap(),
            fixture("text/herdr-config-appended-expected.toml")
        );
    }

    #[test]
    fn refuses_unmanaged_theme_table_without_writing() {
        let file = copy_fixture_to_temp("text/herdr-config-unmanaged-theme.toml");
        let path = file.path().to_string_lossy().to_string();
        let before = std::fs::read_to_string(&path).unwrap();
        let error = apply(path.clone(), &fixture("themes/herdr-theme.toml")).unwrap_err();

        assert!(error.contains("unmanaged [theme]"));
        assert_eq!(std::fs::read_to_string(path).unwrap(), before);
    }

    #[test]
    fn refuses_missing_duplicate_and_reversed_markers() {
        let replacement = fixture("themes/herdr-theme.toml");
        for content in [
            format!("{BEGIN}\n[theme]\nname = \"catppuccin\"\n"),
            format!("{BEGIN}\n{END}\n{BEGIN}\n{END}\n"),
            format!("{END}\n{BEGIN}\n"),
        ] {
            let home = dirs::home_dir().unwrap();
            let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
            file.write_all(content.as_bytes()).unwrap();
            let path = file.path().to_string_lossy().to_string();
            let before = std::fs::read_to_string(&path).unwrap();
            assert!(apply(path.clone(), &replacement).is_err());
            assert_eq!(std::fs::read_to_string(path).unwrap(), before);
        }
    }

    #[test]
    fn refuses_invalid_fragment_and_invalid_final_toml_without_writing() {
        let file = copy_fixture_to_temp("text/herdr-config.toml");
        let path = file.path().to_string_lossy().to_string();
        let before = std::fs::read_to_string(&path).unwrap();
        let invalid_fragment = format!("{BEGIN}\n[theme]\nname = [not-valid\n{END}\n");
        assert!(apply(path.clone(), &invalid_fragment).is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), before);

        let invalid_target = copy_fixture_to_temp("text/herdr-config-invalid.toml");
        let invalid_path = invalid_target.path().to_string_lossy().to_string();
        let invalid_before = std::fs::read_to_string(&invalid_path).unwrap();
        assert!(apply(invalid_path.clone(), &fixture("themes/herdr-theme.toml")).is_err());
        assert_eq!(
            std::fs::read_to_string(invalid_path).unwrap(),
            invalid_before
        );
    }

    #[test]
    fn refuses_target_outside_home() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(fixture("text/herdr-config.toml").as_bytes())
            .unwrap();
        let error = apply(
            file.path().to_string_lossy().to_string(),
            &fixture("themes/herdr-theme.toml"),
        )
        .unwrap_err();
        assert!(error.contains("outside home directory"));
    }

    #[cfg(unix)]
    #[test]
    fn atomic_write_updates_symlink_target_without_replacing_link() {
        use std::os::unix::fs::symlink;

        let home = dirs::home_dir().unwrap();
        let dir = tempfile::TempDir::new_in(home).unwrap();
        let target = dir.path().join("target.toml");
        let link = dir.path().join("config.toml");
        std::fs::write(&target, fixture("text/herdr-config.toml")).unwrap();
        symlink(&target, &link).unwrap();

        apply(
            link.to_string_lossy().to_string(),
            &fixture("themes/herdr-theme.toml"),
        )
        .unwrap();

        assert!(std::fs::symlink_metadata(&link)
            .unwrap()
            .file_type()
            .is_symlink());
        assert_eq!(
            std::fs::read_to_string(target).unwrap(),
            fixture("text/herdr-config-expected.toml")
        );
    }
}
