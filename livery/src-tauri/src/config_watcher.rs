//! Follows the config file for changes made outside Livery. Editors and `git`
//! replace the file through a rename and the file can be a symlink into a
//! dotfiles repo, so the watch sits on the directories that hold it.

use livery_core::config::file_tracker::{ConfigFileEvent, ConfigFileTracker};
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const DEBOUNCE: Duration = Duration::from_millis(200);

enum Message {
    Fs(notify::Result<notify::Event>),
    Rebaseline(Sender<()>),
    Stop,
}

pub struct ConfigWatcher {
    sender: Sender<Message>,
    thread: Option<JoinHandle<()>>,
}

impl ConfigWatcher {
    /// Start following `path`. `sink` runs on the watcher's thread, once per
    /// burst of writes that changed something.
    pub fn start(
        path: PathBuf,
        tracker: &'static Mutex<ConfigFileTracker>,
        sink: impl Fn(ConfigFileEvent) + Send + 'static,
    ) -> notify::Result<Self> {
        let (sender, receiver) = mpsc::channel();
        let fs_sender = sender.clone();
        let notify = notify::recommended_watcher(move |event| {
            let _ = fs_sender.send(Message::Fs(event));
        })?;
        let mut watch = WatchedDirs {
            notify,
            path,
            dirs: Vec::new(),
        };
        watch.arm();
        baseline(watch.path.as_path(), tracker);

        let thread = thread::Builder::new()
            .name("livery-config-watcher".to_string())
            .spawn(move || {
                let mut settles_at: Option<Instant> = None;
                loop {
                    let message = match settles_at {
                        Some(at) => receiver.recv_timeout(at - Instant::now().min(at)),
                        None => receiver.recv().map_err(|_| RecvTimeoutError::Disconnected),
                    };
                    match message {
                        Ok(Message::Fs(Ok(event))) => {
                            // Reads show up as access events, the watcher's own included.
                            if !matches!(event.kind, EventKind::Access(_)) {
                                settles_at = Some(Instant::now() + DEBOUNCE);
                            }
                        }
                        Ok(Message::Fs(Err(error))) => log::warn!("Config watch: {error}"),
                        Ok(Message::Rebaseline(done)) => {
                            settles_at = None;
                            watch.rearm();
                            baseline(watch.path.as_path(), tracker);
                            let _ = done.send(());
                        }
                        Err(RecvTimeoutError::Timeout) => {
                            settles_at = None;
                            watch.arm();
                            if let Some(event) = observe(watch.path.as_path(), tracker) {
                                sink(event);
                            }
                        }
                        Ok(Message::Stop) | Err(RecvTimeoutError::Disconnected) => break,
                    }
                }
            })
            .map_err(notify::Error::io)?;

        Ok(Self {
            sender,
            thread: Some(thread),
        })
    }

    /// Watch afresh and take the file as it is now as the state to compare
    /// against, dropping any burst still settling. A directory removed and
    /// recreated under the watch needs this on some platforms.
    pub fn rebaseline(&self) {
        let (done, wait) = mpsc::channel();
        if self.sender.send(Message::Rebaseline(done)).is_ok() {
            let _ = wait.recv();
        }
    }
}

impl Drop for ConfigWatcher {
    fn drop(&mut self) {
        let _ = self.sender.send(Message::Stop);
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

fn lock(tracker: &Mutex<ConfigFileTracker>) -> std::sync::MutexGuard<'_, ConfigFileTracker> {
    tracker
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
}

fn baseline(path: &Path, tracker: &Mutex<ConfigFileTracker>) {
    let mut tracker = lock(tracker);
    tracker.baseline(std::fs::read_to_string(path));
}

fn observe(path: &Path, tracker: &Mutex<ConfigFileTracker>) -> Option<ConfigFileEvent> {
    let mut tracker = lock(tracker);
    tracker.observe(std::fs::read_to_string(path))
}

struct WatchedDirs {
    notify: RecommendedWatcher,
    path: PathBuf,
    dirs: Vec<PathBuf>,
}

impl WatchedDirs {
    /// The directory holding the path itself catches a symlink being swapped,
    /// and the one holding its target catches the saves.
    fn wanted(&self) -> Vec<PathBuf> {
        let mut wanted: Vec<PathBuf> = [Some(self.path.clone()), self.path.canonicalize().ok()]
            .into_iter()
            .flatten()
            .filter_map(|path| path.parent().map(Path::to_path_buf))
            .collect();
        wanted.dedup();
        wanted
    }

    /// Follow a symlink that now points somewhere else.
    fn arm(&mut self) {
        let wanted = self.wanted();
        for dir in std::mem::take(&mut self.dirs) {
            if wanted.contains(&dir) {
                self.dirs.push(dir);
            } else {
                let _ = self.notify.unwatch(&dir);
            }
        }
        for dir in wanted {
            if self.dirs.contains(&dir) {
                continue;
            }
            match self.notify.watch(&dir, RecursiveMode::NonRecursive) {
                Ok(()) => self.dirs.push(dir),
                Err(error) => log::warn!("Could not watch {}: {error}", dir.display()),
            }
        }
    }

    fn rearm(&mut self) {
        for dir in std::mem::take(&mut self.dirs) {
            let _ = self.notify.unwatch(&dir);
        }
        self.arm();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use livery_core::config::types::Config;
    use std::sync::mpsc::Receiver;

    const SETTLED: Duration = Duration::from_millis(900);
    // Retargeting a symlink restarts the FSEvents stream twice, and each restart
    // takes seconds while parallel tests compete for FSEvents.
    const EVENT_TIMEOUT: Duration = Duration::from_secs(30);

    fn config_json(theme: &str) -> String {
        let config = Config {
            active_theme: Some(theme.to_string()),
            ..Config::default()
        };
        serde_json::to_string_pretty(&config).unwrap()
    }

    fn atomic_write(path: &Path, content: &str) {
        let tmp = path.with_extension("tmp");
        std::fs::write(&tmp, content).unwrap();
        std::fs::rename(&tmp, path).unwrap();
    }

    fn watch(path: &Path) -> (ConfigWatcher, Receiver<ConfigFileEvent>) {
        let tracker: &'static Mutex<ConfigFileTracker> =
            Box::leak(Box::new(Mutex::new(ConfigFileTracker::new())));
        let (sender, events) = mpsc::channel();
        let watcher = ConfigWatcher::start(path.to_path_buf(), tracker, move |event| {
            sender.send(event).unwrap();
        })
        .unwrap();
        // FSEvents can deliver events from just before the stream started.
        thread::sleep(Duration::from_millis(300));
        (watcher, events)
    }

    /// A file directly in the watched directory, and the same save through a
    /// symlinked file into a second directory.
    fn each_layout(test: impl Fn(&Path, &Path)) {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("config.json");
        std::fs::write(&path, config_json("first")).unwrap();
        test(&path, &path);

        let dir = tempfile::TempDir::new().unwrap();
        let tracked = dir.path().join("dots");
        std::fs::create_dir(&tracked).unwrap();
        let target = tracked.join("config.json");
        std::fs::write(&target, config_json("first")).unwrap();
        let home = dir.path().join("home");
        std::fs::create_dir(&home).unwrap();
        let link = home.join("config.json");
        std::os::unix::fs::symlink(&target, &link).unwrap();
        test(&link, &target);
    }

    #[test]
    fn an_atomic_save_is_reported_once() {
        each_layout(|link, target| {
            let (_watcher, events) = watch(link);

            atomic_write(target, &config_json("second"));

            let event = events.recv_timeout(EVENT_TIMEOUT).unwrap();
            assert!(event.active_theme_changed);
            assert_eq!(event.active_theme.as_deref(), Some("second"));
            assert!(events.recv_timeout(SETTLED).is_err());
        });
    }

    #[test]
    fn a_burst_of_saves_is_reported_once_with_the_final_content() {
        each_layout(|link, target| {
            let (_watcher, events) = watch(link);

            for theme in ["second", "third", "fourth"] {
                atomic_write(target, &config_json(theme));
                thread::sleep(Duration::from_millis(20));
            }

            let event = events.recv_timeout(EVENT_TIMEOUT).unwrap();
            assert_eq!(event.active_theme.as_deref(), Some("fourth"));
            assert!(events.recv_timeout(SETTLED).is_err());
        });
    }

    #[test]
    fn a_broken_file_reports_its_error_and_repairing_it_clears_the_error() {
        each_layout(|link, target| {
            let (_watcher, events) = watch(link);

            std::fs::write(target, "{ broken").unwrap();
            let broken = events.recv_timeout(EVENT_TIMEOUT).unwrap();
            assert!(broken.error.is_some());

            atomic_write(target, &config_json("first"));
            let repaired = events.recv_timeout(EVENT_TIMEOUT).unwrap();
            assert_eq!(repaired.error, None);
            assert!(!repaired.active_theme_changed);
        });
    }

    #[test]
    fn identical_content_rewritten_reports_nothing() {
        each_layout(|link, target| {
            let (_watcher, events) = watch(link);

            atomic_write(target, &config_json("first"));

            assert!(events.recv_timeout(SETTLED).is_err());
        });
    }

    #[test]
    fn a_write_recorded_under_the_tracker_lock_reports_nothing() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("config.json");
        std::fs::write(&path, config_json("first")).unwrap();
        let tracker: &'static Mutex<ConfigFileTracker> =
            Box::leak(Box::new(Mutex::new(ConfigFileTracker::new())));
        let (sender, events) = mpsc::channel();
        let _watcher = ConfigWatcher::start(path.clone(), tracker, move |event| {
            sender.send(event).unwrap();
        })
        .unwrap();

        {
            let mut tracker = lock(tracker);
            let content = config_json("mine");
            let before = std::fs::read_to_string(&path).unwrap();
            atomic_write(&path, &content);
            tracker.record_write(Some(&before), &content);
        }

        assert!(events.recv_timeout(SETTLED).is_err());
    }

    #[test]
    fn an_outside_edit_followed_by_a_recorded_write_is_still_reported() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("config.json");
        std::fs::write(&path, config_json("first")).unwrap();
        let tracker: &'static Mutex<ConfigFileTracker> =
            Box::leak(Box::new(Mutex::new(ConfigFileTracker::new())));
        let (sender, events) = mpsc::channel();
        let _watcher = ConfigWatcher::start(path.clone(), tracker, move |event| {
            sender.send(event).unwrap();
        })
        .unwrap();

        let edited = config_json("edited");
        atomic_write(&path, &edited);
        {
            let mut tracker = lock(tracker);
            atomic_write(&path, &edited);
            tracker.record_write(Some(&edited), &edited);
        }

        let event = events.recv_timeout(EVENT_TIMEOUT).unwrap();
        assert!(event.active_theme_changed);
        assert_eq!(event.active_theme.as_deref(), Some("edited"));
        assert!(events.recv_timeout(SETTLED).is_err());
    }

    #[test]
    fn a_symlink_swapped_to_another_target_is_followed() {
        let dir = tempfile::TempDir::new().unwrap();
        let (first_dir, second_dir) = (dir.path().join("first"), dir.path().join("second"));
        std::fs::create_dir(&first_dir).unwrap();
        std::fs::create_dir(&second_dir).unwrap();
        let first = first_dir.join("config.json");
        let second = second_dir.join("config.json");
        std::fs::write(&first, config_json("first")).unwrap();
        std::fs::write(&second, config_json("second")).unwrap();
        let home = dir.path().join("home");
        std::fs::create_dir(&home).unwrap();
        let link = home.join("config.json");
        std::os::unix::fs::symlink(&first, &link).unwrap();
        let (_watcher, events) = watch(&link);

        std::fs::remove_file(&link).unwrap();
        std::os::unix::fs::symlink(&second, &link).unwrap();
        let swapped = events.recv_timeout(EVENT_TIMEOUT).unwrap();
        assert_eq!(swapped.active_theme.as_deref(), Some("second"));

        atomic_write(&second, &config_json("third"));
        let saved = events.recv_timeout(EVENT_TIMEOUT).unwrap();
        assert_eq!(saved.active_theme.as_deref(), Some("third"));
    }

    #[test]
    fn rebaseline_follows_a_recreated_directory_and_drops_the_pending_burst() {
        let dir = tempfile::TempDir::new().unwrap();
        let holder = dir.path().join("livery");
        std::fs::create_dir(&holder).unwrap();
        let path = holder.join("config.json");
        std::fs::write(&path, config_json("first")).unwrap();
        let (watcher, events) = watch(&path);

        std::fs::remove_dir_all(&holder).unwrap();
        std::fs::create_dir(&holder).unwrap();
        std::fs::write(&path, config_json("reset")).unwrap();
        watcher.rebaseline();
        assert!(events.recv_timeout(SETTLED).is_err());

        atomic_write(&path, &config_json("after"));
        let event = events.recv_timeout(EVENT_TIMEOUT).unwrap();
        assert_eq!(event.active_theme.as_deref(), Some("after"));
    }
}
