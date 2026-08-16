//! End-to-end run of the `livery` binary against a tempdir `$HOME`.
//!
//! One test function drives the whole scenario: `$HOME` and the `XDG_*`
//! variables are process-global for the in-process config writes, so the
//! steps must stay sequential.

use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use livery_core::config::types::{AppName, Config};

const BINARY: &str = env!("CARGO_BIN_EXE_livery");
const THEME: &str = "black-atom-jpn-koyo-yoru";

struct Sandbox {
    home: tempfile::TempDir,
}

impl Sandbox {
    fn new() -> Self {
        Self {
            home: tempfile::TempDir::new().unwrap(),
        }
    }

    fn path(&self) -> &Path {
        self.home.path()
    }

    fn config_home(&self) -> PathBuf {
        self.path().join(".config")
    }

    fn data_home(&self) -> PathBuf {
        self.path().join(".local/share")
    }

    /// The updaters shell out to `ps` and `tmux`, so the environment is
    /// extended rather than cleared.
    fn run(&self, args: &[&str]) -> Output {
        Command::new(BINARY)
            .args(args)
            .env("HOME", self.path())
            .env("XDG_CONFIG_HOME", self.config_home())
            .env("XDG_DATA_HOME", self.data_home())
            .output()
            .unwrap()
    }

    /// `livery_core::config` resolves its paths from the process
    /// environment, so writing the seed config needs them set here too.
    fn adopt_env(&self) {
        std::env::set_var("HOME", self.path());
        std::env::set_var("XDG_CONFIG_HOME", self.config_home());
        std::env::set_var("XDG_DATA_HOME", self.data_home());
    }
}

fn stdout(output: &Output) -> String {
    String::from_utf8_lossy(&output.stdout).into_owned()
}

fn fixture(name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../core/tests/fixtures/text")
        .join(name);
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

fn write(path: &Path, content: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, content).unwrap();
}

#[test]
fn cli_end_to_end() {
    let sandbox = Sandbox::new();
    sandbox.adopt_env();

    let tmux_config = sandbox.config_home().join("tmux/tmux.conf");
    let tmux_themes = sandbox.config_home().join("tmux/themes");
    let ghostty_config = sandbox.config_home().join("ghostty/config");
    write(&tmux_config, &fixture("tmux.conf"));
    write(&ghostty_config, &fixture("ghostty-config.txt"));

    // Only tmux and ghostty are enabled; every other app stays off so the
    // scenario never reaches an updater it has not seeded a config for.
    let mut config = Config::default();
    for (app, app_config) in config.apps.iter_mut() {
        app_config.enabled = matches!(app, AppName::Tmux | AppName::Ghostty);
        match app {
            AppName::Tmux => {
                app_config.config_path = tmux_config.to_string_lossy().into_owned();
                // {themesPath} renders verbatim into tmux.conf, so it is not
                // tilde-collapsed and has to be the absolute sandbox path.
                app_config.themes_path = Some(tmux_themes.to_string_lossy().into_owned());
            }
            AppName::Ghostty => {
                app_config.config_path = ghostty_config.to_string_lossy().into_owned();
            }
            _ => {}
        }
    }
    livery_core::config::commands::save_config(config).unwrap();

    let list = sandbox.run(&["list"]);
    assert!(list.status.success(), "list failed: {list:?}");
    let listed = stdout(&list);
    let theme_lines = listed
        .lines()
        .filter(|line| line.contains("black-atom-"))
        .count();
    assert!(theme_lines >= 30, "only {theme_lines} themes listed");
    assert!(
        listed.contains("JPN"),
        "collections are not grouped:\n{listed}"
    );
    assert!(listed.contains(THEME), "{THEME} is missing:\n{listed}");

    let apply = sandbox.run(&["apply", THEME]);
    assert!(apply.status.success(), "apply failed: {apply:?}");
    let patched_tmux = std::fs::read_to_string(&tmux_config).unwrap();
    let patched_ghostty = std::fs::read_to_string(&ghostty_config).unwrap();
    assert!(
        patched_tmux.contains(THEME),
        "tmux not patched:\n{patched_tmux}"
    );
    assert!(
        patched_ghostty.contains(THEME),
        "ghostty not patched:\n{patched_ghostty}"
    );

    // Linking is what makes `linked` true; apply alone never wires a
    // placement.
    let setup = sandbox.run(&["setup", "--yes"]);
    assert!(setup.status.success(), "setup failed: {setup:?}");

    let status = sandbox.run(&["status"]);
    assert!(status.status.success(), "status failed: {status:?}");
    let reported = stdout(&status);
    for app in ["tmux", "ghostty"] {
        let line = reported
            .lines()
            .find(|line| line.starts_with(app))
            .unwrap_or_else(|| panic!("{app} missing from status:\n{reported}"));
        assert!(line.contains("enabled"), "{app} not enabled: {line}");
        assert!(line.contains("linked=true"), "{app} not linked: {line}");
    }

    let unknown = sandbox.run(&["apply", "not-a-theme"]);
    assert!(
        !unknown.status.success(),
        "an unknown theme must exit non-zero: {unknown:?}"
    );
}

#[test]
fn help_lists_every_subcommand() {
    let output = Command::new(BINARY).arg("--help").output().unwrap();
    assert!(output.status.success());
    let help = stdout(&output);
    for command in [
        "apply",
        "list",
        "status",
        "setup",
        "appearance",
        "nvim-settings",
    ] {
        assert!(help.contains(command), "--help omits {command}:\n{help}");
    }
}
