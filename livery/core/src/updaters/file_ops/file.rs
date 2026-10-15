use std::path::PathBuf;

use super::secure::{atomic_write, ensure_under_home};

/// Write a whole file under the user's home directory, creating missing parent directories.
/// Returns whether the content changed. Only an existing file is resolved through its symlink,
/// so a symlinked file keeps its link while a symlinked parent never redirects a new file.
pub fn write_home_file(path: &str, content: &str) -> Result<bool, String> {
    let expanded = PathBuf::from(shellexpand::tilde(path).to_string());
    let display_path = expanded.to_string_lossy().into_owned();
    let parent = expanded
        .parent()
        .ok_or_else(|| format!("No parent directory for {display_path}"))?;
    let existing = parent
        .ancestors()
        .find(|dir| dir.exists())
        .ok_or_else(|| format!("No existing parent directory for {display_path}"))?;
    ensure_under_home(existing, &display_path)?;
    std::fs::create_dir_all(parent)
        .map_err(|e| format!("Failed to create {}: {e}", parent.display()))?;

    if std::fs::read_to_string(&expanded).is_ok_and(|current| current == content) {
        return Ok(false);
    }
    let target = if expanded.exists() {
        ensure_under_home(&expanded, &display_path)?
    } else {
        expanded.clone()
    };
    atomic_write(&target, &display_path, content)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_root() -> tempfile::TempDir {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        tempfile::TempDir::new_in(home).unwrap()
    }

    #[test]
    fn creates_missing_parent_directories() {
        let root = temp_root();
        let target = root.path().join("a/b/theme.json");

        let changed = write_home_file(&target.to_string_lossy(), "{}\n").unwrap();

        assert!(changed);
        assert_eq!(std::fs::read_to_string(&target).unwrap(), "{}\n");
    }

    #[test]
    fn unchanged_content_is_not_rewritten() {
        let root = temp_root();
        let target = root.path().join("theme.json");
        write_home_file(&target.to_string_lossy(), "{}\n").unwrap();

        let changed = write_home_file(&target.to_string_lossy(), "{}\n").unwrap();

        assert!(!changed);
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_file_keeps_its_link() {
        let root = temp_root();
        let real = root.path().join("real.json");
        std::fs::write(&real, "old\n").unwrap();
        let link = root.path().join("link.json");
        std::os::unix::fs::symlink(&real, &link).unwrap();

        write_home_file(&link.to_string_lossy(), "new\n").unwrap();

        assert!(std::fs::symlink_metadata(&link)
            .unwrap()
            .file_type()
            .is_symlink());
        assert_eq!(std::fs::read_to_string(&real).unwrap(), "new\n");
    }

    #[test]
    fn rejects_paths_outside_home_without_creating_them() {
        let outside = tempfile::TempDir::new().unwrap();
        if outside
            .path()
            .canonicalize()
            .unwrap()
            .starts_with(dirs::home_dir().unwrap().canonicalize().unwrap())
        {
            return;
        }
        let target = outside.path().join("new/theme.json");

        let error = write_home_file(&target.to_string_lossy(), "{}\n").unwrap_err();

        assert!(error.contains("outside home"), "{error}");
        assert!(!outside.path().join("new").exists());
    }
}
