//! The set of user-facing actions livery exposes. Each variant names one
//! Tauri command; the CLI and the GUI both prove they cover every variant
//! through an exhaustive match, so a new capability cannot reach only one
//! of the two clients.

/// Declares the variants, `ALL`, and `command_name` from a single list, so
/// a variant cannot exist without also appearing in `ALL`.
macro_rules! capabilities {
    ($($variant:ident => $command:literal),+ $(,)?) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum Capability {
            $($variant),+
        }

        impl Capability {
            pub const ALL: &'static [Capability] = &[$(Capability::$variant),+];

            /// The snake_case name of the Tauri command carrying this capability.
            pub fn command_name(self) -> &'static str {
                match self {
                    $(Capability::$variant => $command),+
                }
            }
        }
    };
}

capabilities! {
    GetConfig => "get_config",
    SaveConfig => "save_config",
    DetectApps => "detect_apps",
    GetAppStatus => "get_app_status",
    LinkAppThemes => "link_app_themes",
    UpdateApp => "update_app",
    VerifyAppPath => "verify_app_path",
    UpdateSystemAppearance => "update_system_appearance",
    WriteNvimSettings => "write_nvim_settings",
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn command_names_are_unique_and_snake_case() {
        let mut names: Vec<&str> = Capability::ALL
            .iter()
            .map(|cap| cap.command_name())
            .collect();
        assert_eq!(names.len(), Capability::ALL.len());
        names.sort_unstable();
        names.dedup();
        assert_eq!(names.len(), Capability::ALL.len(), "duplicate command name");
        for name in names {
            assert!(
                name.chars().all(|c| c.is_ascii_lowercase() || c == '_'),
                "{name} is not snake_case"
            );
        }
    }

    #[test]
    fn all_lists_each_variant_exactly_once() {
        let mut seen: Vec<String> = Capability::ALL
            .iter()
            .map(|cap| format!("{cap:?}"))
            .collect();
        let total = seen.len();
        seen.sort_unstable();
        seen.dedup();
        assert_eq!(seen.len(), total, "ALL lists a variant twice");
    }
}
