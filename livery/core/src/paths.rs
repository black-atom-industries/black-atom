//! XDG base directory resolution for livery's own state.
//!
//! `dirs::config_dir()` resolves to `~/Library/Application Support` on macOS,
//! which is not where livery's config lives on any platform. These functions
//! follow the XDG variables with a `~/.config` / `~/.local/share` fallback.

use std::path::{Path, PathBuf};

/// `$XDG_CONFIG_HOME`, else `~/.config`.
pub fn config_home() -> PathBuf {
    resolve(std::env::var_os("XDG_CONFIG_HOME"), ".config")
}

/// `$XDG_DATA_HOME`, else `~/.local/share`.
pub fn data_home() -> PathBuf {
    resolve(std::env::var_os("XDG_DATA_HOME"), ".local/share")
}

/// `<config_home>/black-atom/livery` — holds `config.json`.
pub fn livery_config_dir() -> PathBuf {
    config_home().join("black-atom").join("livery")
}

/// `<data_home>/black-atom/themes` — the unpacked adapter theme files.
pub fn themes_root() -> PathBuf {
    data_home().join("black-atom").join("themes")
}

fn resolve(var: Option<std::ffi::OsString>, fallback: &str) -> PathBuf {
    resolve_with(var, dirs::home_dir().as_deref(), fallback)
}

/// An empty or relative `XDG_*` value is ignored — the spec requires absolute
/// paths, and a relative one would put livery's state wherever the app was
/// launched from.
fn resolve_with(var: Option<std::ffi::OsString>, home: Option<&Path>, fallback: &str) -> PathBuf {
    if let Some(value) = var {
        let path = PathBuf::from(value);
        if path.is_absolute() {
            return path;
        }
    }
    match home {
        Some(home) => home.join(fallback),
        None => PathBuf::from(fallback),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsString;

    #[test]
    fn test_absolute_env_var_wins_over_home() {
        assert_eq!(
            resolve_with(
                Some(OsString::from("/custom/data")),
                Some(Path::new("/home/nik")),
                ".local/share"
            ),
            PathBuf::from("/custom/data")
        );
    }

    #[test]
    fn test_unset_var_falls_back_under_home() {
        assert_eq!(
            resolve_with(None, Some(Path::new("/home/nik")), ".config"),
            PathBuf::from("/home/nik/.config")
        );
    }

    #[test]
    fn test_empty_and_relative_values_are_ignored() {
        for value in ["", "relative/path"] {
            assert_eq!(
                resolve_with(
                    Some(OsString::from(value)),
                    Some(Path::new("/home/nik")),
                    ".config"
                ),
                PathBuf::from("/home/nik/.config"),
                "value {value:?} must not be honoured"
            );
        }
    }
}
