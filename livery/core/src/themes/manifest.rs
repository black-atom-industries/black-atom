use std::collections::HashMap;
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};

pub const MANIFEST_FILE: &str = "manifest.json";

/// One adapter's download state. `etag` is the codeload response ETag —
/// enough for future staleness checks without a GitHub API dependency.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ManifestEntry {
    pub etag: Option<String>,
    /// Unix epoch seconds; the frontend formats for display.
    pub fetched_at_epoch: u64,
    pub file_count: u32,
}

/// Persistent state of the managed themes directory, stored as
/// `manifest.json` at its root. Missing or unreadable manifests read as
/// default — a crashed or partial download must never wedge the app.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ThemesManifest {
    #[serde(default)]
    pub adapters: HashMap<String, ManifestEntry>,
    /// Set by the first-run greeting's "continue without" escape, so
    /// hand-managed setups aren't greeted on every launch.
    #[serde(default)]
    pub greeting_dismissed: bool,
}

pub fn read_manifest(managed_root: &Path) -> ThemesManifest {
    let path = managed_root.join(MANIFEST_FILE);
    let Ok(content) = std::fs::read_to_string(&path) else {
        return ThemesManifest::default();
    };
    serde_json::from_str(&content).unwrap_or_default()
}

/// Atomic write via tempfile + persist, same discipline as the config io.
pub fn write_manifest(managed_root: &Path, manifest: &ThemesManifest) -> Result<(), String> {
    std::fs::create_dir_all(managed_root)
        .map_err(|e| format!("Failed to create themes directory: {e}"))?;

    let json = serde_json::to_string_pretty(manifest)
        .map_err(|e| format!("Failed to serialize themes manifest: {e}"))?;

    let mut file = tempfile::NamedTempFile::new_in(managed_root)
        .map_err(|e| format!("Failed to create temp manifest: {e}"))?;
    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write temp manifest: {e}"))?;
    file.persist(managed_root.join(MANIFEST_FILE))
        .map_err(|e| format!("Failed to persist themes manifest: {e}"))?;

    Ok(())
}

/// Read-modify-write of a single adapter entry.
pub fn upsert_entry(managed_root: &Path, app: &str, entry: ManifestEntry) -> Result<(), String> {
    let mut manifest = read_manifest(managed_root);
    manifest.adapters.insert(app.to_string(), entry);
    write_manifest(managed_root, &manifest)
}

/// Remove a single adapter entry; absent entries are a no-op, not an error.
pub fn remove_entry(managed_root: &Path, app: &str) -> Result<(), String> {
    let mut manifest = read_manifest(managed_root);
    if manifest.adapters.remove(app).is_none() {
        return Ok(());
    }
    write_manifest(managed_root, &manifest)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_root() -> tempfile::TempDir {
        let home = dirs::home_dir().expect("Cannot determine home directory");
        tempfile::TempDir::new_in(home).unwrap()
    }

    #[test]
    fn test_missing_manifest_reads_as_default() {
        let root = temp_root();
        let manifest = read_manifest(root.path());
        assert!(manifest.adapters.is_empty());
        assert!(!manifest.greeting_dismissed);
    }

    #[test]
    fn test_corrupt_manifest_reads_as_default() {
        let root = temp_root();
        std::fs::write(root.path().join(MANIFEST_FILE), "{not json").unwrap();
        let manifest = read_manifest(root.path());
        assert!(manifest.adapters.is_empty());
    }

    #[test]
    fn test_roundtrip_and_upsert() {
        let root = temp_root();
        upsert_entry(
            root.path(),
            "tmux",
            ManifestEntry {
                etag: Some("\"abc123\"".to_string()),
                fetched_at_epoch: 1_751_884_800,
                file_count: 44,
            },
        )
        .unwrap();
        upsert_entry(
            root.path(),
            "tmux",
            ManifestEntry {
                etag: None,
                fetched_at_epoch: 1_751_888_400,
                file_count: 45,
            },
        )
        .unwrap();

        let manifest = read_manifest(root.path());
        assert_eq!(manifest.adapters.len(), 1);
        let entry = &manifest.adapters["tmux"];
        assert_eq!(entry.fetched_at_epoch, 1_751_888_400);
        assert_eq!(entry.file_count, 45);
        assert_eq!(entry.etag, None);
    }

    #[test]
    fn test_remove_entry_is_idempotent() {
        let root = temp_root();
        upsert_entry(
            root.path(),
            "nvim",
            ManifestEntry {
                etag: None,
                fetched_at_epoch: 1,
                file_count: 7,
            },
        )
        .unwrap();

        remove_entry(root.path(), "nvim").unwrap();
        assert!(read_manifest(root.path()).adapters.is_empty());
        // Removing an absent entry succeeds quietly.
        remove_entry(root.path(), "nvim").unwrap();
        remove_entry(root.path(), "never-existed").unwrap();
    }

    #[test]
    fn test_dismissal_flag_survives_upserts() {
        let root = temp_root();
        let mut manifest = read_manifest(root.path());
        manifest.greeting_dismissed = true;
        write_manifest(root.path(), &manifest).unwrap();

        upsert_entry(
            root.path(),
            "ghostty",
            ManifestEntry {
                etag: None,
                fetched_at_epoch: 1,
                file_count: 1,
            },
        )
        .unwrap();

        assert!(read_manifest(root.path()).greeting_dismissed);
    }
}
