use std::io;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use specta::Type;

use super::io::merge_with_defaults;
use super::types::{AppName, Config};

/// What a look at the config file found. `error` is set while the file can't
/// be read as a Config, and every other field is then false or empty.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct ConfigFileEvent {
    pub error: Option<String>,
    pub nvim_settings_changed: bool,
    pub active_theme_changed: bool,
    pub active_theme: Option<String>,
}

/// Parse a config file's content without falling back to anything or writing.
pub fn parse_config(content: &str) -> Result<Config, String> {
    serde_json::from_str::<Config>(content)
        .map(merge_with_defaults)
        .map_err(|error| error.to_string())
}

fn same_config(a: &Config, b: &Config) -> bool {
    serde_json::to_value(a).ok() == serde_json::to_value(b).ok()
}

fn nvim_settings(config: &Config) -> Option<&super::types::NvimSettings> {
    config.apps.get(&AppName::Nvim)?.settings.as_ref()
}

/// The last good Config this process knows of. Livery's own writes and the
/// watcher's reads share one lock, so the watcher never compares a file against
/// a write that hasn't landed yet.
#[derive(Default)]
pub struct ConfigFileTracker {
    last_good: Option<Config>,
    error: Option<String>,
}

impl ConfigFileTracker {
    pub const fn new() -> Self {
        Self {
            last_good: None,
            error: None,
        }
    }

    pub fn last_good(&self) -> Option<&Config> {
        self.last_good.as_ref()
    }

    /// Take a read of the file as the state to compare against, reporting nothing.
    pub fn baseline(&mut self, read: io::Result<String>) {
        self.error = None;
        self.last_good = None;
        self.observe(read);
    }

    /// Record content Livery itself just wrote over `before`. A `before` that
    /// differs from the last good Config is an outside change the watcher hasn't
    /// reported yet, so the last good Config stays for the watcher to compare against.
    pub fn record_write(&mut self, before: Option<&str>, written: &str) {
        let outside_change = match (before, &self.last_good) {
            (Some(before), Some(last_good)) => {
                parse_config(before).map_or(true, |config| !same_config(last_good, &config))
            }
            _ => false,
        };
        if outside_change {
            return;
        }
        if let Ok(config) = parse_config(written) {
            self.last_good = Some(config);
        }
    }

    /// Compare a read of the file against the last good Config. Nothing comes
    /// back for a missing file, or for content that changes nothing and clears
    /// no error. A later good read is compared against the last good Config, so
    /// a change made through a broken stretch still counts.
    pub fn observe(&mut self, read: io::Result<String>) -> Option<ConfigFileEvent> {
        let content = match read {
            Ok(content) => content,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return None,
            Err(error) => return self.observe_invalid(error.to_string()),
        };
        let config = match parse_config(&content) {
            Ok(config) => config,
            Err(error) => return self.observe_invalid(error),
        };

        let was_invalid = self.error.take().is_some();
        let previous = self.last_good.replace(config.clone());
        let changed = previous.as_ref().is_none_or(|p| !same_config(p, &config));
        if !changed && !was_invalid {
            return None;
        }

        Some(ConfigFileEvent {
            error: None,
            nvim_settings_changed: previous
                .as_ref()
                .is_some_and(|p| nvim_settings(p) != nvim_settings(&config)),
            active_theme_changed: previous
                .as_ref()
                .is_some_and(|p| p.active_theme != config.active_theme),
            active_theme: config.active_theme,
        })
    }

    fn observe_invalid(&mut self, error: String) -> Option<ConfigFileEvent> {
        if self.error.as_ref() == Some(&error) {
            return None;
        }
        self.error = Some(error.clone());
        Some(ConfigFileEvent {
            error: Some(error),
            nvim_settings_changed: false,
            active_theme_changed: false,
            active_theme: None,
        })
    }
}

static TRACKER: Mutex<ConfigFileTracker> = Mutex::new(ConfigFileTracker::new());

/// The tracker shared by every config write in this process and its watcher.
pub fn config_file_tracker() -> &'static Mutex<ConfigFileTracker> {
    &TRACKER
}

#[cfg(test)]
mod tests {
    use super::*;

    fn content(edit: impl FnOnce(&mut Config)) -> io::Result<String> {
        let mut config = Config::default();
        edit(&mut config);
        Ok(serde_json::to_string_pretty(&config).unwrap())
    }

    fn tracker() -> ConfigFileTracker {
        let mut tracker = ConfigFileTracker::new();
        tracker.baseline(content(|_| {}));
        tracker
    }

    #[test]
    fn identical_content_reports_nothing_whatever_its_formatting() {
        let mut tracker = tracker();
        let compact = serde_json::to_string(&Config::default()).unwrap();

        assert_eq!(tracker.observe(Ok(compact)), None);
    }

    #[test]
    fn a_file_missing_default_apps_equals_the_same_file_with_them_filled_in() {
        let mut tracker = tracker();
        let sparse = serde_json::json!({
            "version": Config::default().version,
            "system_appearance": Config::default().system_appearance,
            "apps": {},
        });

        assert_eq!(tracker.observe(Ok(sparse.to_string())), None);
    }

    #[test]
    fn an_active_theme_change_names_the_new_theme() {
        let mut tracker = tracker();

        let event = tracker
            .observe(content(|c| c.active_theme = Some("a-theme".to_string())))
            .unwrap();

        assert!(event.active_theme_changed);
        assert!(!event.nvim_settings_changed);
        assert_eq!(event.active_theme.as_deref(), Some("a-theme"));
    }

    #[test]
    fn an_nvim_settings_change_is_reported_as_one() {
        let mut tracker = tracker();

        let event = tracker
            .observe(content(|c| {
                let nvim = c.apps.get_mut(&AppName::Nvim).unwrap();
                nvim.settings.as_mut().unwrap().term_colors ^= true;
            }))
            .unwrap();

        assert!(event.nvim_settings_changed);
        assert!(!event.active_theme_changed);
    }

    #[test]
    fn another_change_is_reported_with_nothing_to_act_on() {
        let mut tracker = tracker();

        let event = tracker
            .observe(content(|c| c.system_appearance ^= true))
            .unwrap();

        assert!(!event.nvim_settings_changed);
        assert!(!event.active_theme_changed);
        assert_eq!(event.error, None);
    }

    #[test]
    fn invalid_content_reports_its_error_once_and_keeps_the_last_good_config() {
        let mut tracker = tracker();
        let kept = content(|c| c.active_theme = Some("kept".to_string())).unwrap();
        tracker.record_write(None, &kept);

        let event = tracker.observe(Ok("{ broken".to_string())).unwrap();

        assert!(event.error.is_some());
        assert_eq!(tracker.observe(Ok("{ broken".to_string())), None);
        assert_eq!(
            tracker.last_good().unwrap().active_theme.as_deref(),
            Some("kept")
        );
    }

    #[test]
    fn valid_json_that_is_no_config_counts_as_invalid() {
        let mut tracker = tracker();

        let event = tracker.observe(Ok(r#"{"apps": 1}"#.to_string())).unwrap();

        assert!(event.error.is_some());
    }

    #[test]
    fn repairing_a_broken_file_to_its_old_content_clears_the_error() {
        let mut tracker = tracker();
        tracker.observe(Ok("{ broken".to_string()));

        let event = tracker.observe(content(|_| {})).unwrap();

        assert_eq!(
            event,
            ConfigFileEvent {
                error: None,
                nvim_settings_changed: false,
                active_theme_changed: false,
                active_theme: None,
            }
        );
    }

    #[test]
    fn a_change_made_through_a_broken_stretch_still_counts() {
        let mut tracker = tracker();
        tracker.observe(Ok("{ broken".to_string()));

        let event = tracker
            .observe(content(|c| c.active_theme = Some("after".to_string())))
            .unwrap();

        assert!(event.active_theme_changed);
    }

    #[test]
    fn a_recorded_write_reads_back_as_no_change() {
        let mut tracker = tracker();
        let written = content(|c| c.active_theme = Some("mine".to_string())).unwrap();

        let before = content(|_| {}).unwrap();

        tracker.record_write(Some(&before), &written);

        assert_eq!(tracker.observe(Ok(written)), None);
    }

    #[test]
    fn a_write_over_an_unreported_outside_change_leaves_that_change_to_report() {
        let mut tracker = tracker();
        let edited = content(|c| c.active_theme = Some("edited".to_string())).unwrap();

        tracker.record_write(Some(&edited), &edited);

        let event = tracker.observe(Ok(edited)).unwrap();
        assert!(event.active_theme_changed);
        assert_eq!(event.active_theme.as_deref(), Some("edited"));
    }

    #[test]
    fn a_write_right_after_a_repair_still_clears_the_error() {
        let mut tracker = tracker();
        tracker.observe(Ok("{ broken".to_string()));
        let good = content(|_| {}).unwrap();

        tracker.record_write(Some(&good), &good);

        assert_eq!(tracker.observe(Ok(good)).unwrap().error, None);
    }

    #[test]
    fn a_missing_file_reports_nothing_and_keeps_state() {
        let mut tracker = tracker();

        let missing = io::Error::from(io::ErrorKind::NotFound);

        assert_eq!(tracker.observe(Err(missing)), None);
        assert!(tracker.last_good().is_some());
    }

    #[test]
    fn a_file_broken_from_the_start_recovers_with_nothing_to_act_on() {
        let mut tracker = ConfigFileTracker::new();
        tracker.baseline(Ok("{ broken".to_string()));

        let event = tracker
            .observe(content(|c| c.active_theme = Some("first".to_string())))
            .unwrap();

        assert_eq!(event.error, None);
        assert!(!event.active_theme_changed);
    }
}
