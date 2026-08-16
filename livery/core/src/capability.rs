//! The set of user-facing actions livery exposes. Each variant names one
//! Tauri command; the CLI and the GUI both prove they cover every variant
//! through an exhaustive match, so a new capability cannot reach only one
//! of the two clients.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    GetConfig,
    SaveConfig,
    DetectApps,
    GetAppStatus,
    LinkAppThemes,
    UpdateApp,
    VerifyAppPath,
    UpdateSystemAppearance,
    WriteNvimSettings,
}

impl Capability {
    pub const ALL: &'static [Capability] = &[
        Capability::GetConfig,
        Capability::SaveConfig,
        Capability::DetectApps,
        Capability::GetAppStatus,
        Capability::LinkAppThemes,
        Capability::UpdateApp,
        Capability::VerifyAppPath,
        Capability::UpdateSystemAppearance,
        Capability::WriteNvimSettings,
    ];

    /// The snake_case name of the Tauri command carrying this capability.
    pub fn command_name(self) -> &'static str {
        match self {
            Capability::GetConfig => "get_config",
            Capability::SaveConfig => "save_config",
            Capability::DetectApps => "detect_apps",
            Capability::GetAppStatus => "get_app_status",
            Capability::LinkAppThemes => "link_app_themes",
            Capability::UpdateApp => "update_app",
            Capability::VerifyAppPath => "verify_app_path",
            Capability::UpdateSystemAppearance => "update_system_appearance",
            Capability::WriteNvimSettings => "write_nvim_settings",
        }
    }
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
}
