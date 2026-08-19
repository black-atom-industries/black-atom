//! End-to-end run of the `livery` binary against a tempdir `$HOME`.
//!
//! One test function drives the whole scenario: `$HOME` and the `XDG_*`
//! variables are process-global for the in-process config writes, so the
//! steps must stay sequential.

use std::path::{Path, PathBuf};
use std::process::{Command, Output};

#[cfg(any(target_os = "linux", target_os = "macos"))]
use std::os::unix::fs::PermissionsExt;

use livery_core::config::types::{AppName, Config};

const BINARY: &str = env!("CARGO_BIN_EXE_livery");
/// The theme `setup` applies when it is not asked interactively.
const DEFAULT_THEME: &str = "black-atom-default-dark";

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

    fn obsidian_registry(&self) -> PathBuf {
        #[cfg(target_os = "macos")]
        {
            return self
                .path()
                .join("Library/Application Support/obsidian/obsidian.json");
        }
        #[cfg(target_os = "linux")]
        {
            return self.config_home().join("obsidian/obsidian.json");
        }
        #[cfg(target_os = "windows")]
        {
            return self.config_home().join("Obsidian/obsidian.json");
        }
        #[allow(unreachable_code)]
        self.config_home().join("obsidian/obsidian.json")
    }

    fn appearance_log(&self) -> PathBuf {
        self.path().join("appearance.log")
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    fn install_system_appearance_stub(&self, exit_code: u8) {
        let bin_dir = self.path().join("bin");
        std::fs::create_dir_all(&bin_dir).unwrap();
        for command in ["gsettings", "osascript"] {
            let path = bin_dir.join(command);
            write(
                &path,
                &format!(
                    "#!/bin/sh\nprintf '%s\\n' \"$*\" > \"$LIVERY_APPEARANCE_LOG\"\nexit {exit_code}\n"
                ),
            );
            let mut permissions = std::fs::metadata(&path).unwrap().permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(path, permissions).unwrap();
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    fn install_concurrency_barrier_stubs(&self) {
        let bin_dir = self.path().join("bin");
        std::fs::create_dir_all(&bin_dir).unwrap();
        for (command, own_marker, peer_marker) in [
            ("ps", "ps-started", "tmux-started"),
            ("tmux", "tmux-started", "ps-started"),
        ] {
            let path = bin_dir.join(command);
            write(
                &path,
                &format!(
                    "#!/bin/sh\ntouch \"$HOME/{own_marker}\"\nfor _ in $(seq 1 100); do\n  test -f \"$HOME/{peer_marker}\" && exit 0\n  sleep 0.01\ndone\nexit 1\n"
                ),
            );
            let mut permissions = std::fs::metadata(&path).unwrap().permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(path, permissions).unwrap();
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    fn remove_concurrency_barrier_stubs(&self) {
        for command in ["ps", "tmux"] {
            std::fs::remove_file(self.path().join("bin").join(command)).unwrap();
        }
    }

    /// The updaters shell out to `ps` and `tmux`, so the environment is
    /// extended rather than cleared.
    fn run(&self, args: &[&str]) -> Output {
        let mut paths = vec![self.path().join("bin")];
        paths.extend(std::env::split_paths(
            &std::env::var_os("PATH").unwrap_or_default(),
        ));

        Command::new(BINARY)
            .args(args)
            .env("HOME", self.path())
            .env("XDG_CONFIG_HOME", self.config_home())
            .env("XDG_DATA_HOME", self.data_home())
            .env("LIVERY_APPEARANCE_LOG", self.appearance_log())
            .env("PATH", std::env::join_paths(paths).unwrap())
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
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    sandbox.install_system_appearance_stub(0);

    let tmux_config = sandbox.config_home().join("tmux/tmux.conf");
    let tmux_themes = sandbox.config_home().join("tmux/themes");
    let ghostty_config = sandbox.config_home().join("ghostty/config");
    write(&tmux_config, &fixture("tmux.conf"));
    write(&ghostty_config, &fixture("ghostty-config.txt"));
    let vault_a = sandbox.path().join("notes");
    let vault_b = sandbox.path().join("work-notes");
    for vault in [&vault_a, &vault_b] {
        write(&vault.join(".obsidian/appearance.json"), "{}\n");
    }
    write(
        &sandbox.obsidian_registry(),
        &serde_json::to_string(&serde_json::json!({
            "vaults": {
                "notes": { "path": vault_a },
                "work": { "path": vault_b }
            }
        }))
        .unwrap(),
    );

    // Only tmux and ghostty are enabled initially; setup discovers Obsidian
    // from the registry and enables it with both vault config folders.
    // scenario never reaches an updater it has not seeded a config for.
    let mut config = Config::default();
    for (app, app_config) in config.apps.iter_mut() {
        app_config.enabled = matches!(app, AppName::Tmux | AppName::Ghostty);
        match app {
            AppName::Tmux => {
                app_config.config_path = Some(tmux_config.to_string_lossy().into_owned());
                // {themesPath} renders verbatim into tmux.conf, so it is not
                // tilde-collapsed and has to be the absolute sandbox path.
                app_config.themes_path = Some(tmux_themes.to_string_lossy().into_owned());
            }
            AppName::Ghostty => {
                app_config.config_path = Some(ghostty_config.to_string_lossy().into_owned());
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

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    sandbox.install_concurrency_barrier_stubs();
    let apply = sandbox.run(&["apply", THEME]);
    assert!(apply.status.success(), "apply failed: {apply:?}");
    assert!(
        stdout(&apply).contains("appearance"),
        "appearance result missing:\n{}",
        stdout(&apply)
    );
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        sandbox.remove_concurrency_barrier_stubs();
        assert!(
            stdout(&apply)
                .lines()
                .any(|line| line.starts_with("  ghostty") && line.contains("done")),
            "ghostty and tmux updaters did not overlap:\n{}",
            stdout(&apply)
        );
        assert!(
            std::fs::read_to_string(sandbox.appearance_log())
                .is_ok_and(|arguments| !arguments.trim().is_empty()),
            "system appearance command was not called"
        );

        sandbox.install_system_appearance_stub(1);
        let failed_apply = sandbox.run(&["apply", THEME]);
        assert!(
            !failed_apply.status.success(),
            "appearance failure must fail apply: {failed_apply:?}"
        );
        assert!(
            String::from_utf8_lossy(&failed_apply.stderr).contains("1 update(s) failed"),
            "appearance failure missing from stderr: {failed_apply:?}"
        );

        // The failing stub belongs to the assertion above. Later steps apply
        // a theme too, and would inherit the failure.
        sandbox.install_system_appearance_stub(0);
    }
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
    let setup_output = stdout(&setup);
    assert!(
        setup_output.lines().any(|line| {
            line.starts_with("  obsidian")
                && line.contains("notes/.obsidian")
                && line.contains("work-notes/.obsidian")
        }),
        "setup must print discovered Obsidian config folders:\n{setup_output}"
    );
    for folder in ["notes/.obsidian", "work-notes/.obsidian"] {
        assert!(
            setup_output
                .lines()
                .any(|line| line.contains(folder) && line.contains("link=done")),
            "setup must report link outcome for {folder}:\n{setup_output}"
        );
        assert!(
            setup_output
                .lines()
                .any(|line| line.contains(folder) && line.contains("verify=ok")),
            "setup must report verification outcome for {folder}:\n{setup_output}"
        );
    }

    let status = sandbox.run(&["status"]);
    assert!(status.status.success(), "status failed: {status:?}");
    let reported = stdout(&status);
    assert!(
        reported
            .lines()
            .next()
            .is_some_and(|line| line.starts_with("theme") && line.contains(DEFAULT_THEME)),
        "setup must apply and record the default theme:\n{reported}"
    );
    for app in ["tmux", "ghostty", "obsidian"] {
        let line = reported
            .lines()
            .find(|line| line.starts_with(app))
            .unwrap_or_else(|| panic!("{app} missing from status:\n{reported}"));
        assert!(line.contains("enabled"), "{app} not enabled: {line}");
        assert!(line.contains("linked=true"), "{app} not linked: {line}");
    }
    for vault in [&vault_a, &vault_b] {
        assert!(
            vault
                .join(".obsidian/themes/Black Atom/theme.css")
                .is_symlink(),
            "Obsidian theme was not linked for {}",
            vault.display()
        );
    }
    // Keep the later all-updaters-fail assertion focused on the original two
    // switch-pointer adapters; discovery and linking were already asserted.
    let mut after_setup = livery_core::config::commands::get_config();
    after_setup
        .apps
        .get_mut(&AppName::Obsidian)
        .unwrap()
        .enabled = false;
    livery_core::config::commands::save_config(after_setup).unwrap();

    let unknown = sandbox.run(&["apply", "not-a-theme"]);
    assert!(
        !unknown.status.success(),
        "an unknown theme must exit non-zero: {unknown:?}"
    );

    // The record follows what was written, not what was attempted: a pass
    // where nothing succeeds must leave the previous theme standing. System
    // appearance has to fail too — flipping the OS is itself a real change.
    std::fs::write(&tmux_config, "# no switch pointer here\n").unwrap();
    std::fs::write(&ghostty_config, "# no switch pointer here\n").unwrap();
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    sandbox.install_system_appearance_stub(1);

    let broken = sandbox.run(&["apply", THEME]);
    assert!(
        !broken.status.success(),
        "an apply where every updater fails must exit non-zero: {broken:?}"
    );

    let after = sandbox.run(&["status"]);
    let reported = stdout(&after);
    assert!(
        reported
            .lines()
            .next()
            .is_some_and(|line| line.starts_with("theme") && line.contains(DEFAULT_THEME)),
        "a failed apply must not overwrite the recorded theme:\n{reported}"
    );
}

/// A failing step inside `setup` must reach the exit code — the command is
/// not "done" just because it printed an error row. No `adopt_env` here: the
/// binary gets its sandbox through the subprocess environment alone, so this
/// test stays independent of `cli_end_to_end`.
#[test]
fn setup_with_a_failing_step_exits_non_zero() {
    let sandbox = Sandbox::new();
    // ghostty sits at its default path so detection finds it, but the
    // sibling `themes` it links into is a regular file — linking must fail.
    write(
        &sandbox.config_home().join("ghostty/config"),
        "theme = none\n",
    );
    write(
        &sandbox.config_home().join("ghostty/themes"),
        "not a directory\n",
    );

    let output = sandbox.run(&["setup", "--yes"]);

    assert!(
        !output.status.success(),
        "a failing setup step must exit non-zero: {output:?}"
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
