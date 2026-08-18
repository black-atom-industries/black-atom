//! Livery's own record of what it last did, kept beside the unpacked themes
//! in `$XDG_DATA_HOME/black-atom/state.json`.
//!
//! Data, not config: livery writes it, nobody hand-edits it, and losing it
//! costs nothing but the Active Theme marker.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

/// `<data_home>/black-atom/state.json`.
fn state_path() -> PathBuf {
    crate::paths::state_path()
}

/// The theme livery last applied. A record of an action livery took, not a
/// claim about what each app renders right now — a hand-edited app config
/// drifts from it without livery ever hearing about it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct State {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_theme: Option<String>,
}

/// Read the whole record. A missing, unreadable or malformed file reads as
/// the default — losing the marker is not worth failing a command over.
pub fn get_state() -> State {
    read_state_at(&state_path())
}

/// The key of the theme livery last applied, if there is a record.
///
/// The key is stored, not resolved: a `rename-theme` pass can leave one here
/// that no longer names a theme, so callers resolve it against the catalogue
/// and treat a miss like an absence.
pub fn get_active_theme() -> Option<String> {
    get_state().active_theme
}

/// Record `key` as the theme livery last applied.
pub fn set_active_theme(key: &str) -> Result<(), String> {
    set_active_theme_at(&state_path(), key)
}

fn read_state_at(path: &Path) -> State {
    let Ok(contents) = fs::read_to_string(path) else {
        return State::default();
    };
    serde_json::from_str(&contents).unwrap_or_else(|e| {
        log::warn!("Failed to parse the livery state file, ignoring it: {e}");
        State::default()
    })
}

fn set_active_theme_at(path: &Path, key: &str) -> Result<(), String> {
    let mut state = read_state_at(path);
    state.active_theme = Some(key.to_string());
    write_state_at(path, &state)
}

/// Written through a temp file in the same directory, so a concurrent reader
/// never observes a half-written record.
fn write_state_at(path: &Path, state: &State) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("{} has no parent directory", path.display()))?;
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create the state dir: {e}"))?;

    let mut json = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize the state: {e}"))?;
    json.push('\n');

    let mut tmp = tempfile::NamedTempFile::new_in(parent)
        .map_err(|e| format!("Failed to create a temp state file: {e}"))?;
    tmp.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write the state: {e}"))?;
    tmp.persist(path)
        .map_err(|e| format!("Failed to move the state file into place: {}", e.error))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("state")
            .join(name)
    }

    /// Fixtures are read-only inputs — a test that writes copies one into a
    /// temp dir first, so a run never mutates the checked-in file.
    fn temp_state_from(fixture_name: Option<&str>) -> (tempfile::TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("state.json");
        if let Some(name) = fixture_name {
            fs::copy(fixture(name), &path).unwrap();
        }
        (dir, path)
    }

    #[test]
    fn test_a_recorded_theme_reads_back_out_of_the_file() {
        let (_dir, path) = temp_state_from(Some("state.json"));
        assert_eq!(
            read_state_at(&path).active_theme.as_deref(),
            Some("black-atom-jpn-koyo-yoru")
        );
    }

    #[test]
    fn test_malformed_and_missing_files_read_as_no_record() {
        let (_dir, malformed) = temp_state_from(Some("state-malformed.json"));
        assert_eq!(read_state_at(&malformed), State::default());

        let (dir, _) = temp_state_from(None);
        assert_eq!(
            read_state_at(&dir.path().join("does-not-exist.json")),
            State::default()
        );
    }

    /// A record hand-trimmed to `{}` must not error — the field is optional
    /// on the way in.
    #[test]
    fn test_an_empty_record_reads_as_no_record() {
        let (_dir, path) = temp_state_from(Some("state-empty.json"));
        assert_eq!(read_state_at(&path), State::default());
    }

    #[test]
    fn test_setting_a_theme_creates_the_file_and_its_parent_dir() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("nested").join("state.json");

        set_active_theme_at(&path, "black-atom-terra-spring-day").unwrap();

        assert_eq!(
            read_state_at(&path).active_theme.as_deref(),
            Some("black-atom-terra-spring-day")
        );
    }

    #[test]
    fn test_setting_a_theme_twice_writes_identical_bytes() {
        let (_dir, path) = temp_state_from(None);

        set_active_theme_at(&path, "black-atom-terra-spring-day").unwrap();
        let once = fs::read_to_string(&path).unwrap();
        set_active_theme_at(&path, "black-atom-terra-spring-day").unwrap();
        let twice = fs::read_to_string(&path).unwrap();

        assert_eq!(once, twice);
    }

    #[test]
    fn test_setting_a_theme_replaces_the_previous_record() {
        let (_dir, path) = temp_state_from(Some("state.json"));

        set_active_theme_at(&path, "black-atom-mnml-dark").unwrap();

        assert_eq!(
            read_state_at(&path).active_theme.as_deref(),
            Some("black-atom-mnml-dark")
        );
    }

    /// The field is skipped when empty, so a record with nothing in it stays
    /// `{}` rather than growing a `null`.
    #[test]
    fn test_an_empty_record_serializes_without_the_field() {
        assert_eq!(serde_json::to_string(&State::default()).unwrap(), "{}");
    }
}
