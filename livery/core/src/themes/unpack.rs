//! Writes the adapter theme payload into `paths::themes_root()`.
//!
//! Runs at startup and before theme operations. A `.stamp` file holding a
//! hash of the whole payload decides whether anything needs writing, so an
//! unchanged payload costs nothing and edited adapter sources replace the
//! tree. See [`embedded::payload`] for where a build reads the payload from.

use std::borrow::Cow;
use std::path::Path;

use super::embedded::{self, Adapter, Origin, PayloadFile};
use crate::paths;

const STAMP_FILE: &str = ".stamp";
const STAGING_PREFIX: &str = ".staging-";
const RETIRED_PREFIX: &str = ".retired-";

/// What a startup unpack did.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct UnpackReport {
    /// `false` when the stamp already matched — nothing was written.
    pub unpacked: bool,
    pub adapters: u32,
    pub files: u32,
    pub stamp: String,
}

/// Bring `<themes_root>` in sync with the payload.
pub fn ensure_unpacked() -> Result<UnpackReport, String> {
    let root = paths::themes_root();
    let payloads = Adapter::ALL
        .iter()
        .map(|&adapter| embedded::payload(adapter).map(|files| (adapter, files)))
        .collect::<Result<Vec<_>, _>>()?;
    let stamp = payload_stamp(&payloads);

    std::fs::create_dir_all(&root)
        .map_err(|e| format!("Failed to create {}: {e}", root.display()))?;
    sweep_stale_dirs(&root);

    if std::fs::read_to_string(root.join(STAMP_FILE)).is_ok_and(|found| found.trim() == stamp) {
        return Ok(UnpackReport {
            unpacked: false,
            adapters: 0,
            files: 0,
            stamp,
        });
    }

    let mut files = 0;
    let mut adapters = 0;
    for (adapter, payload) in &payloads {
        files += unpack_adapter(&root, *adapter, payload)?;
        adapters += 1;
    }

    std::fs::write(root.join(STAMP_FILE), &stamp)
        .map_err(|e| format!("Failed to write the unpack stamp: {e}"))?;

    Ok(UnpackReport {
        unpacked: true,
        adapters,
        files,
        stamp,
    })
}

/// Write one adapter into `.staging-<adapter>`, then swap it over the live
/// dir — a failure part-way never leaves a half-written adapter visible.
fn unpack_adapter(root: &Path, adapter: Adapter, payload: &[PayloadFile]) -> Result<u32, String> {
    let name = adapter.dir_name();
    let staging = root.join(format!("{STAGING_PREFIX}{name}"));
    let _ = std::fs::remove_dir_all(&staging);
    std::fs::create_dir_all(&staging)
        .map_err(|e| format!("Failed to create {}: {e}", staging.display()))?;

    let mut files = 0;
    for file in payload {
        let dest = match file.origin {
            Origin::Dir(prefix) => {
                let Some(file_name) = file.path.file_name().and_then(|n| n.to_str()) else {
                    continue;
                };
                if !is_unpackable(prefix, file_name) {
                    continue;
                }
                staging.join(prefix).join(&file.path)
            }
            Origin::Extra => staging.join(&file.path),
        };
        write_file(&dest, &file.contents()?)?;
        files += 1;
    }

    swap_into_place(&staging, &root.join(name), name)?;
    Ok(files)
}

/// Which embedded files reach the disk. Generated themes are named
/// `black-atom-*`; everything else an adapter repo carries (templates,
/// READMEs, licences) stays in the binary. The nvim runtime under `lua/`
/// is not theme output but the colorschemes fail to load without it.
fn is_unpackable(prefix: &str, file_name: &str) -> bool {
    prefix == "lua" || file_name.starts_with("black-atom-")
}

fn write_file(path: &Path, contents: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create {}: {e}", parent.display()))?;
    }
    std::fs::write(path, contents).map_err(|e| format!("Failed to write {}: {e}", path.display()))
}

/// Replace `dest` with `staging`. Plain renames within one directory; the
/// retired dir goes last so a crash between renames is recoverable by
/// re-running.
fn swap_into_place(staging: &Path, dest: &Path, adapter: &str) -> Result<(), String> {
    let retired = dest.with_file_name(format!("{RETIRED_PREFIX}{adapter}"));
    let _ = std::fs::remove_dir_all(&retired);

    if dest.exists() {
        std::fs::rename(dest, &retired)
            .map_err(|e| format!("Failed to retire the previous {adapter} themes: {e}"))?;
    }
    if let Err(e) = std::fs::rename(staging, dest) {
        if retired.exists() {
            let _ = std::fs::rename(&retired, dest);
        }
        let _ = std::fs::remove_dir_all(staging);
        return Err(format!("Failed to activate {adapter} themes: {e}"));
    }
    let _ = std::fs::remove_dir_all(&retired);
    Ok(())
}

/// Drop staging and retired leftovers from a run that died mid-swap.
fn sweep_stale_dirs(root: &Path) {
    let Ok(entries) = std::fs::read_dir(root) else {
        return;
    };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if name.starts_with(STAGING_PREFIX) || name.starts_with(RETIRED_PREFIX) {
            let _ = std::fs::remove_dir_all(entry.path());
        }
    }
}

/// A hash over every payload file's path and contents, templates included.
/// Content-addressed rather than version-tagged: `CARGO_PKG_VERSION` holds
/// still across a development cycle, so a debug build with edited adapters
/// would keep serving the previously unpacked tree.
fn payload_stamp(payloads: &[(Adapter, Vec<PayloadFile>)]) -> String {
    let mut entries: Vec<(String, Cow<[u8]>)> = payloads
        .iter()
        .flat_map(|(adapter, files)| {
            files.iter().map(move |file| {
                let path = match file.origin {
                    Origin::Dir(prefix) => {
                        Path::new(adapter.dir_name()).join(prefix).join(&file.path)
                    }
                    Origin::Extra => Path::new(adapter.dir_name()).join(&file.path),
                };
                (path.to_string_lossy().into_owned(), file.fingerprint())
            })
        })
        .collect();
    entries.sort_by(|a, b| a.0.cmp(&b.0));

    // FNV-1a: no dependency, and stable across processes and releases unlike
    // `DefaultHasher`, whose output std explicitly does not guarantee.
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    let mut eat = |bytes: &[u8]| {
        for byte in bytes {
            hash ^= *byte as u64;
            hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
        }
    };
    for (path, contents) in &entries {
        eat(path.as_bytes());
        eat(&[0]);
        eat(contents.as_ref());
        eat(&[0]);
    }
    format!("{hash:016x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_only_generated_themes_and_the_nvim_runtime_unpack() {
        assert!(is_unpackable("", "black-atom-jpn-koyo-dark.conf"));
        assert!(!is_unpackable("", "collection.template.conf"));
        assert!(!is_unpackable("", "README.md"));
        assert!(!is_unpackable("", "LICENSE"));
        // The nvim runtime is not theme output, but the colorschemes
        // `require` it, so the whole tree ships.
        assert!(is_unpackable("lua", "init.lua"));
        assert!(is_unpackable("lua", "highlights.lua"));
        assert!(is_unpackable("colors", "black-atom-jpn-koyo-dark.lua"));
        assert!(!is_unpackable("colors", "template.lua"));
    }

    fn embedded_payloads() -> Vec<(Adapter, Vec<PayloadFile>)> {
        Adapter::ALL
            .iter()
            .map(|&adapter| (adapter, embedded::payload_from(adapter, None).unwrap()))
            .collect()
    }

    #[test]
    fn test_stamp_is_stable_and_hex() {
        let stamp = payload_stamp(&embedded_payloads());
        assert_eq!(stamp, payload_stamp(&embedded_payloads()));
        assert_eq!(stamp.len(), 16);
        assert!(stamp.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_repo_payload_follows_edits_on_disk() {
        let adapters = tempfile::TempDir::new().unwrap();
        let theme = adapters
            .path()
            .join("ghostty/themes/default/black-atom-default-dark.conf");
        std::fs::create_dir_all(theme.parent().unwrap()).unwrap();
        std::fs::write(&theme, "background = #000000").unwrap();

        let read = || {
            vec![(
                Adapter::Ghostty,
                embedded::payload_from(Adapter::Ghostty, Some(adapters.path())).unwrap(),
            )]
        };
        let before = read();
        assert_eq!(
            before[0].1[0].contents().unwrap().as_ref(),
            b"background = #000000"
        );

        std::fs::write(&theme, "background = #ff0000ff").unwrap();
        let after = read();
        assert_eq!(
            after[0].1[0].contents().unwrap().as_ref(),
            b"background = #ff0000ff"
        );
        assert_ne!(payload_stamp(&before), payload_stamp(&after));
    }
}
