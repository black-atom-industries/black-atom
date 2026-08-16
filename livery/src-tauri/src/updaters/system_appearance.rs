use super::UpdateResult;

const APP_STR: &str = "system_appearance";

/// Toggle system-wide dark/light mode.
/// macOS: osascript. Linux/GNOME: gsettings. Other platforms: skipped.
pub fn update(appearance: &str) -> UpdateResult {
    let dark = match appearance {
        "dark" => true,
        "light" => false,
        other => return UpdateResult::error(APP_STR, format!("Unknown appearance: {other}")),
    };

    if cfg!(target_os = "macos") {
        update_macos(dark)
    } else if cfg!(target_os = "linux") {
        update_linux(dark)
    } else {
        UpdateResult::skipped(APP_STR, "Unsupported platform")
    }
}

fn update_macos(dark: bool) -> UpdateResult {
    let script = format!(
        "tell application \"System Events\" to tell appearance preferences to set dark mode to {}",
        dark
    );

    match std::process::Command::new("osascript")
        .args(["-e", &script])
        .output()
    {
        Ok(output) if output.status.success() => {
            log::info!(
                "Set macOS appearance to {}",
                if dark { "dark" } else { "light" }
            );
            UpdateResult::done(APP_STR)
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            UpdateResult::error(APP_STR, format!("osascript failed: {stderr}"))
        }
        Err(e) => UpdateResult::error(APP_STR, format!("Failed to run osascript: {e}")),
    }
}

fn update_linux(dark: bool) -> UpdateResult {
    let scheme = if dark { "prefer-dark" } else { "prefer-light" };

    match std::process::Command::new("gsettings")
        .args(["set", "org.gnome.desktop.interface", "color-scheme", scheme])
        .output()
    {
        Ok(output) if output.status.success() => {
            log::info!("Set Linux appearance to {}", scheme);
            UpdateResult::done(APP_STR)
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // gsettings not available likely means not GNOME — skip rather than error
            if stderr.contains("No such schema") || stderr.contains("not found") {
                UpdateResult::skipped(APP_STR, "GNOME settings not available (non-GNOME desktop?)")
            } else {
                UpdateResult::error(APP_STR, format!("gsettings failed: {stderr}"))
            }
        }
        Err(_) => UpdateResult::skipped(APP_STR, "gsettings not found (non-GNOME desktop?)"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::updaters::UpdateStatus;

    #[test]
    fn unknown_appearance_returns_error() {
        let result = update("banana");
        assert_eq!(result.status, UpdateStatus::Error);
        assert!(result.message.unwrap().contains("Unknown appearance"));
    }

    #[test]
    fn dark_appearance_is_accepted() {
        // Can't assert on the outcome (platform-dependent), but should not panic
        let result = update("dark");
        assert!(result.status == UpdateStatus::Done || result.status == UpdateStatus::Skipped);
    }

    #[test]
    fn light_appearance_is_accepted() {
        let result = update("light");
        assert!(result.status == UpdateStatus::Done || result.status == UpdateStatus::Skipped);
    }
}
