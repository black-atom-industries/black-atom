use std::io::Write;
use std::path::{Path, PathBuf};

/// Resolve an existing file and ensure its real target stays under the user's home directory.
/// Returning the canonical path lets atomic writers update a symlink target without replacing the
/// symlink itself.
pub(super) fn resolve_home_file(path: &str) -> Result<(String, PathBuf), String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let home = home.canonicalize().unwrap_or(home);
    let expanded = shellexpand::tilde(path).to_string();
    let resolved = PathBuf::from(&expanded)
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path {expanded}: {e}"))?;

    if !resolved.starts_with(&home) {
        return Err(format!(
            "Path outside home directory is not allowed: {expanded}"
        ));
    }

    if !resolved.is_file() {
        return Err(format!("Path is not a file: {expanded}"));
    }

    Ok((expanded, resolved))
}

/// Atomically replace an existing file using a temp file in the same directory.
pub(super) fn atomic_write(
    resolved: &Path,
    display_path: &str,
    content: &str,
) -> Result<(), String> {
    let parent = resolved
        .parent()
        .ok_or_else(|| format!("No parent directory for {display_path}"))?;
    let mut tmp = tempfile::NamedTempFile::new_in(parent)
        .map_err(|e| format!("Failed to create temp file: {e}"))?;
    tmp.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    tmp.persist(resolved)
        .map_err(|e| format!("Failed to persist to {display_path}: {e}"))?;
    Ok(())
}
