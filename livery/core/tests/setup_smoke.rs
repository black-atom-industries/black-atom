//! Hermetic end-to-end smoke test of the adapter setup chain.
//!
//! Runs the real core functions — ensure_unpacked → get_config → detect_apps
//! → save_config → link_app_themes → verify_app_path → get_app_status —
//! against a tempdir `$HOME` with planted app configs. `$HOME` and the `XDG_*`
//! variables are process-global, so every test takes `ENV_LOCK` and each
//! scenario stays sequential.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Mutex, MutexGuard};
use std::time::Duration;

use tokio::runtime::Runtime;

use livery_core::config::types::AppName;
use livery_core::paths;
use livery_core::themes::registry::{provisioning, ThemeProvisioning};
use livery_core::themes::{commands as themes, detect, unpack};
use livery_core::updaters::UpdateStatus;

static ENV_LOCK: Mutex<()> = Mutex::new(());

fn env_lock() -> MutexGuard<'static, ()> {
    ENV_LOCK
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn runtime() -> &'static Runtime {
    static RUNTIME: std::sync::OnceLock<Runtime> = std::sync::OnceLock::new();
    RUNTIME.get_or_init(|| Runtime::new().unwrap())
}

fn block_on<F: std::future::Future>(future: F) -> F::Output {
    runtime().block_on(future)
}

fn write_file(path: &Path, content: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, content).unwrap();
}

/// Every file below `root`, as root-relative paths, sorted. Symlinked
/// directories are not followed.
fn walk_names(root: &Path) -> Vec<String> {
    let mut names = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).unwrap().flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else {
                names.push(
                    path.strip_prefix(root)
                        .unwrap()
                        .to_string_lossy()
                        .into_owned(),
                );
            }
        }
    }
    names.sort();
    names
}

fn assert_managed_symlink(link: &Path, managed_root: &Path) {
    let raw = std::fs::read_link(link)
        .unwrap_or_else(|e| panic!("expected symlink at {}: {e}", link.display()));
    assert!(
        raw.is_relative(),
        "{} is not relative: {}",
        link.display(),
        raw.display()
    );
    let target = link
        .canonicalize()
        .unwrap_or_else(|e| panic!("dangling link {}: {e}", link.display()));
    assert!(
        target.starts_with(managed_root.canonicalize().unwrap()),
        "{} points outside the managed root: {}",
        link.display(),
        target.display()
    );
    assert!(target.is_file(), "dangling link: {}", target.display());
}

#[test]
fn setup_chain_end_to_end() {
    let _env = env_lock();
    // `TMPDIR` is not consulted: an earlier test leaves it pointing at a deleted directory.
    let fake_home = tempfile::TempDir::new_in(Path::new("/tmp").canonicalize().unwrap()).unwrap();
    let home = fake_home.path();
    std::env::set_var("HOME", home);
    assert_eq!(
        dirs::home_dir().as_deref(),
        Some(home),
        "HOME override must reach dirs::home_dir"
    );
    // Deliberately not `$HOME/.config` and `$HOME/.local/share`: livery's own
    // state must follow the XDG variables, not a home-relative guess.
    let xdg_config = home.join("xdg-config");
    let xdg_data = home.join("xdg-data");
    std::env::set_var("XDG_CONFIG_HOME", &xdg_config);
    std::env::set_var("XDG_DATA_HOME", &xdg_data);
    // Neovim's updater reloads every instance whose socket is under `$TMPDIR`. Short, because
    // a socket path has a length limit.
    let socket_root = tempfile::TempDir::new_in("/tmp").unwrap();
    std::env::set_var("TMPDIR", socket_root.path());
    assert_eq!(
        paths::themes_root(),
        xdg_data.join("black-atom/themes"),
        "themes root must follow XDG_DATA_HOME"
    );
    assert_eq!(
        paths::livery_config_dir(),
        xdg_config.join("black-atom/livery"),
        "livery config dir must follow XDG_CONFIG_HOME"
    );

    // Plant app configs: ghostty/zed/tmux exist, plus an obsidian config_folder.
    write_file(
        &home.join(".config/ghostty/config"),
        "theme = black-atom-default-dark.conf\n",
    );
    write_file(&home.join(".config/zed/settings.json"), "{}\n");
    write_file(
        &home.join(".config/tmux/tmux.conf"),
        "source-file ~/.config/tmux/themes/black-atom-jpn-koyo-dark.conf\n",
    );
    write_file(
        &home.join(".config/herdr/config.toml"),
        "# BEGIN BLACK ATOM LIVERY THEME\n[theme]\nname = \"terminal\"\n# END BLACK ATOM LIVERY THEME\n",
    );
    write_file(
        &home.join(".claude/settings.json"),
        "{\"theme\": \"custom:black-atom\"}\n",
    );
    let config_folder = home.join("config_folder/.obsidian");
    let appearance = config_folder.join("appearance.json");
    write_file(&appearance, "{\"cssTheme\":\"Black Atom\"}\n");

    // 0. Startup unpack: the embedded adapter output lands under the themes
    // root before anything else runs.
    let managed_root = paths::themes_root();
    let report = unpack::ensure_unpacked().unwrap();
    assert!(report.unpacked, "first run must write the embedded themes");
    assert_eq!(report.adapters, 14);
    assert!(report.files > 200, "unpacked only {} files", report.files);

    for (adapter, file) in [
        ("delta", "default/black-atom-default-dark.gitconfig"),
        ("ghostty", "default/black-atom-default-dark.conf"),
        ("tmux", "jpn/black-atom-jpn-koyo-dark.conf"),
        ("zed", "jpn/black-atom-jpn-koyo-dark.json"),
        ("obsidian", "jpn/black-atom-jpn-koyo-dark.css"),
        ("obsidian", "theme.css"),
        ("obsidian", "manifest.json"),
        ("nvim", "colors/black-atom-jpn-koyo-dark.lua"),
        ("nvim", "lua/black-atom/init.lua"),
        ("niri", "default/black-atom-default-dark.kdl"),
        ("waybar", "default/black-atom-default-dark.css"),
        ("wezterm", "default/black-atom-default-dark.toml"),
        ("herdr", "default/black-atom-default-dark.toml"),
        ("tuicr", "default/black-atom-default-dark.toml"),
        ("lazygit", "default/black-atom-default-dark.yml"),
        ("kagi", "default/black-atom-default.css"),
        ("claude-code", "default/black-atom-default-dark.json"),
    ] {
        let path = managed_root.join(adapter).join(file);
        assert!(path.is_file(), "missing unpacked file: {}", path.display());
    }

    // Templates and repo noise stay in the binary.
    let unpacked: Vec<String> = walk_names(&managed_root);
    assert!(
        unpacked.iter().all(|n| !n.contains("collection.template.")),
        "templates reached the disk"
    );
    assert!(
        unpacked
            .iter()
            .all(|n| !n.ends_with("README.md") && !n.ends_with("LICENSE")),
        "repo noise reached the disk"
    );

    let stamp = std::fs::read_to_string(managed_root.join(".stamp")).unwrap();
    assert_eq!(stamp, report.stamp);
    assert_eq!(stamp.len(), 16, "stamp must be a hex payload hash");

    // A second call sees its own stamp and writes nothing.
    let rerun = unpack::ensure_unpacked().unwrap();
    assert!(!rerun.unpacked, "unchanged payload must not re-unpack");
    assert_eq!(rerun.stamp, report.stamp);
    assert_eq!(walk_names(&managed_root), unpacked);

    // A stale stamp forces a fresh unpack, and staging leftovers are swept.
    std::fs::write(managed_root.join(".stamp"), "0000000000000000").unwrap();
    std::fs::create_dir_all(managed_root.join(".staging-abc")).unwrap();
    std::fs::create_dir_all(managed_root.join(".retired-tmux")).unwrap();
    let restamped = unpack::ensure_unpacked().unwrap();
    assert!(restamped.unpacked, "a differing stamp must re-unpack");
    assert!(!managed_root.join(".staging-abc").exists());
    assert!(!managed_root.join(".retired-tmux").exists());

    // 1. First config read materializes the defaults: everything disabled.
    let mut config = livery_core::config::commands::get_config();
    assert!(config.apps.values().all(|app| !app.enabled));

    // 2. Conservative detection: planted configured locations are found, everything else not.
    std::fs::create_dir_all(xdg_config.join("nvim")).unwrap();
    let detections = block_on(detect::detect_apps());
    let mut found: Vec<&str> = detections
        .iter()
        .filter(|d| d.found)
        .map(|d| d.app.as_str())
        .collect();
    found.sort_unstable();
    assert_eq!(
        found,
        ["claude-code", "ghostty", "herdr", "nvim", "tmux", "zed"],
        "detected apps"
    );
    let obsidian = detections
        .iter()
        .find(|d| d.app == AppName::Obsidian)
        .unwrap();
    let claude_code_detection = detections
        .iter()
        .find(|d| d.app == AppName::ClaudeCode)
        .unwrap();
    assert_eq!(
        claude_code_detection.config_folders.as_deref(),
        Some([home.join(".claude").to_string_lossy().into_owned()].as_slice()),
        "claude-code discovers ~/.claude"
    );
    assert!(
        !obsidian.found && obsidian.config_path.is_empty(),
        "obsidian must not auto-detect without a configured config folder"
    );

    // 3. Enable the detected apps + lazygit, supply Obsidian's config folder.
    for (app, app_config) in config.apps.iter_mut() {
        match app {
            AppName::Ghostty | AppName::Zed | AppName::Tmux | AppName::Lazygit | AppName::Herdr => {
                app_config.enabled = true;
            }
            AppName::ClaudeCode => {
                app_config.enabled = true;
                app_config.config_folders = claude_code_detection.config_folders.clone();
            }
            AppName::Obsidian => {
                app_config.enabled = true;
                app_config.config_path = None;
                app_config.config_folders = Some(vec![config_folder.to_string_lossy().to_string()]);
            }
            _ => {}
        }
    }
    livery_core::config::commands::save_config(config).unwrap();

    // 4. Link the Linked adapters, then check the placements on disk.
    for app in [
        AppName::Delta,
        AppName::Ghostty,
        AppName::Zed,
        AppName::Tmux,
        AppName::Obsidian,
        AppName::Nvim,
        AppName::Rex,
        AppName::Tuicr,
    ] {
        let result = block_on(themes::link_app_themes(app));
        assert!(
            matches!(result.status, UpdateStatus::Done),
            "link {} failed: {:?}",
            app.as_str(),
            result.message
        );
        assert!(result.linked.unwrap_or(0) > 0);
    }
    for link in [
        home.join(".config/delta/themes/black-atom-jpn-koyo-dark.gitconfig"),
        home.join(".config/ghostty/themes/black-atom-jpn-koyo-dark.conf"),
        home.join(".config/ghostty/themes/black-atom-default-dark.conf"),
        home.join(".config/tmux/themes/black-atom-jpn-koyo-dark.conf"),
        home.join(".config/zed/themes/black-atom-jpn-koyo-dark.json"),
        home.join(".config/tuicr/themes/black-atom-jpn-koyo-dark.toml"),
        managed_root.join("rex/Black Atom — JPN ∷ Koyo Dark"),
        home.join("config_folder/.obsidian/themes/Black Atom/theme.css"),
        home.join("config_folder/.obsidian/themes/Black Atom/manifest.json"),
    ] {
        assert_managed_symlink(&link, &managed_root);
    }
    // nvim gets one directory symlink into the runtimepath instead of
    // per-file links: neovim adds `pack/*/start/*` itself.
    let pack_link = xdg_data.join("nvim/site/pack/black-atom/start/black-atom");
    assert!(std::fs::read_link(&pack_link).unwrap().is_relative());
    assert_eq!(
        pack_link.canonicalize().unwrap(),
        managed_root.join("nvim").canonicalize().unwrap(),
        "nvim pack dir must point at the unpacked themes"
    );
    assert!(pack_link
        .join("colors/black-atom-jpn-koyo-dark.lua")
        .is_file());
    assert!(pack_link.join("lua/black-atom/init.lua").is_file());
    // Merged adapters consume the managed dir directly — linking is a skip.
    for app in [AppName::Lazygit, AppName::Herdr, AppName::ClaudeCode] {
        let link = block_on(themes::link_app_themes(app));
        assert!(matches!(link.status, UpdateStatus::Skipped));
    }

    // 5. Status: every app carries its class and its editable fields, and
    // the seven Linked adapters now report their placement as wired.
    let status = block_on(themes::get_app_status()).unwrap();
    assert_eq!(status.len(), AppName::all().len());
    for entry in &status {
        assert_eq!(entry.provisioning, provisioning(entry.app));
        assert_eq!(
            entry.editable_fields,
            livery_core::themes::registry::editable_fields(entry.app)
        );
        assert_eq!(
            entry.linked,
            entry.provisioning == ThemeProvisioning::Linked,
            "linked state for {}",
            entry.app.as_str()
        );
    }

    // A theme file generated after linking has no link yet: applying to a
    // wired app syncs its links before the config names the theme.
    let unlinked = home.join(".config/ghostty/themes/black-atom-jpn-koyo-dark.conf");
    std::fs::remove_file(&unlinked).unwrap();
    let applied = block_on(livery_core::updaters::update_app(
        AppName::Ghostty,
        livery_core::updaters::ThemeContext {
            theme_key: "black-atom-jpn-koyo-dark".to_string(),
            appearance: "dark".to_string(),
            collection_key: "jpn".to_string(),
            theme_label: None,
        },
    ));
    assert!(
        matches!(applied.status, UpdateStatus::Done),
        "apply ghostty failed: {:?}",
        applied.message
    );
    assert_managed_symlink(&unlinked, &managed_root);

    // Unwire two placements by hand: `linked` must follow the disk, not the
    // provisioning class it was just compared against.
    std::fs::remove_file(&pack_link).unwrap();
    std::fs::remove_dir_all(home.join(".config/ghostty/themes")).unwrap();
    let unwired = block_on(themes::get_app_status()).unwrap();
    for entry in &unwired {
        let expected = entry.provisioning == ThemeProvisioning::Linked
            && entry.app != AppName::Nvim
            && entry.app != AppName::Ghostty;
        assert_eq!(
            entry.linked,
            expected,
            "linked state after unwiring for {}",
            entry.app.as_str()
        );
    }

    // 6. Verify lands truthful per adapter.
    let ghostty = block_on(livery_core::updaters::verify_app_path(AppName::Ghostty));
    assert!(ghostty.exists);
    assert_eq!(ghostty.pattern_matches, Some(true));

    let tmux = block_on(livery_core::updaters::verify_app_path(AppName::Tmux));
    assert!(tmux.exists);
    assert_eq!(tmux.pattern_matches, Some(true));

    let zed = block_on(livery_core::updaters::verify_app_path(AppName::Zed));
    assert!(zed.exists);
    assert_eq!(zed.pattern_matches, None, "zed patches structurally");

    let herdr = block_on(livery_core::updaters::verify_app_path(AppName::Herdr));
    assert!(herdr.exists);
    assert_eq!(herdr.pattern_matches, None, "herdr patches a managed block");

    let claude_code = block_on(livery_core::updaters::verify_app_path(AppName::ClaudeCode));
    assert!(claude_code.exists);
    assert_eq!(
        claude_code.config_folders.map(|folders| folders.len()),
        Some(1)
    );

    // nvim has no config path: its verdict follows the pack link, removed above.
    let nvim = block_on(livery_core::updaters::verify_app_path(AppName::Nvim));
    assert!(!nvim.exists, "the pack link was unwired above");
    let relink = block_on(themes::link_app_themes(AppName::Nvim));
    assert!(matches!(relink.status, UpdateStatus::Done));
    let nvim = block_on(livery_core::updaters::verify_app_path(AppName::Nvim));
    assert!(nvim.exists, "a wired pack link needs nothing else");

    // A config_path left in an old config.json plays no part in that verdict.
    let mut config = livery_core::config::commands::get_config();
    let nvim_config = config.apps.get_mut(&AppName::Nvim).unwrap();
    nvim_config.config_path = Some("~/no/such/config.lua".to_string());
    nvim_config.match_pattern = Some("no such line".to_string());
    livery_core::config::commands::save_config(config).unwrap();
    let nvim = block_on(livery_core::updaters::verify_app_path(AppName::Nvim));
    assert!(nvim.exists && nvim.pattern_matches.is_none(), "{nvim:?}");

    // 7. A saved option reaches a running Neovim through a reload.
    reload_reaches_a_running_neovim(socket_root.path(), home, &xdg_config, &xdg_data);

    // 8. A config file that can't be read is never replaced.
    a_broken_config_is_left_as_written();
}

fn a_broken_config_is_left_as_written() {
    use livery_core::config::commands::{
        get_active_theme, get_config, get_config_file_error, save_config, set_active_theme,
    };
    use livery_core::config::io::{config_path, ensure_config_exists};

    const THEME: &str = "black-atom-jpn-koyo-yoru";
    const BROKEN: &str = "{ \"apps\": half-typed";

    set_active_theme(THEME).unwrap();
    let good = get_config();
    let path = config_path();
    let good_content = std::fs::read_to_string(&path).unwrap();
    assert_eq!(get_config_file_error(), None);

    std::fs::write(&path, BROKEN).unwrap();

    assert!(get_config_file_error().is_some());
    assert_eq!(get_active_theme().as_deref(), Some(THEME));
    let error = save_config(good).unwrap_err();
    assert!(error.contains("left as it is"), "{error}");
    assert!(set_active_theme("black-atom-jpn-koyo-dark").is_err());
    ensure_config_exists();
    assert_eq!(std::fs::read_to_string(&path).unwrap(), BROKEN);

    std::fs::write(&path, &good_content).unwrap();
    assert_eq!(get_config_file_error(), None);
    set_active_theme("black-atom-jpn-koyo-dark").unwrap();
    let unchanged = std::fs::read_to_string(&path).unwrap();
    set_active_theme("black-atom-jpn-koyo-dark").unwrap();
    assert_eq!(std::fs::read_to_string(&path).unwrap(), unchanged);
}

/// Serves a headless Neovim on a socket Livery's reload finds, as a session would.
struct RunningNeovim {
    child: std::process::Child,
    socket: std::path::PathBuf,
}

impl RunningNeovim {
    fn start(
        socket_root: &Path,
        pid: u32,
        home: &Path,
        xdg_config: &Path,
        xdg_data: &Path,
    ) -> Self {
        let dir = socket_root.join("nvim.fixture/0");
        std::fs::create_dir_all(&dir).unwrap();
        let socket = dir.join(format!("nvim.{pid}.0"));
        let init = home.join("reload-init.lua");
        write_file(&init, "");
        let child = Command::new("nvim")
            .env("HOME", home)
            .env("XDG_CONFIG_HOME", xdg_config)
            .env("XDG_DATA_HOME", xdg_data)
            .env("XDG_STATE_HOME", home.join("state"))
            .env("XDG_CACHE_HOME", home.join("cache"))
            .env_remove("VIMINIT")
            .args(["--headless", "-u"])
            .arg(&init)
            .arg("--listen")
            .arg(&socket)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let neovim = Self { child, socket };
        for _ in 0..200 {
            if neovim.socket.exists() && neovim.try_eval("1").is_some() {
                return neovim;
            }
            std::thread::sleep(Duration::from_millis(50));
        }
        panic!("headless nvim never opened {}", neovim.socket.display());
    }

    fn try_eval(&self, expr: &str) -> Option<String> {
        let output = Command::new("nvim")
            .arg("--server")
            .arg(&self.socket)
            .args(["--remote-expr", expr])
            .output()
            .unwrap();
        output
            .status
            .success()
            .then(|| String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    fn eval(&self, expr: &str) -> String {
        self.try_eval(expr)
            .unwrap_or_else(|| panic!("nvim refused {expr}"))
    }
}

impl Drop for RunningNeovim {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// The option as of the last `:colorscheme`, so it only moves when a reload ran.
const LOADED_GUTTER: &str = "luaeval(\"require('black-atom').config.dark_gutter and 1 or 0\")";

fn reload_reaches_a_running_neovim(
    socket_root: &Path,
    home: &Path,
    xdg_config: &Path,
    xdg_data: &Path,
) {
    use livery_core::config::commands::{get_config, save_config, set_active_theme};
    use livery_core::updaters::reload_nvim;

    const THEME: &str = "black-atom-jpn-koyo-dark";

    let mut config = get_config();
    config.apps.get_mut(&AppName::Nvim).unwrap().enabled = false;
    save_config(config).unwrap();
    let disabled = block_on(reload_nvim());
    assert_eq!(disabled.status, UpdateStatus::Skipped, "{disabled:?}");

    let mut config = get_config();
    config.active_theme = None;
    config.apps.get_mut(&AppName::Nvim).unwrap().enabled = true;
    save_config(config).unwrap();
    let no_theme = block_on(reload_nvim());
    assert_eq!(no_theme.status, UpdateStatus::Done, "{no_theme:?}");

    set_active_theme(THEME).unwrap();
    let no_instances = block_on(reload_nvim());
    assert_eq!(no_instances.status, UpdateStatus::Done, "{no_instances:?}");

    if !std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
        .any(|dir| dir.join("nvim").is_file())
    {
        eprintln!("skipped: nvim not on PATH");
        return;
    }

    let neovim = RunningNeovim::start(socket_root, 999_999, home, xdg_config, xdg_data);
    assert_eq!(neovim.eval("g:colors_name"), THEME);
    let own = RunningNeovim::start(socket_root, 999_998, home, xdg_config, xdg_data);
    own.eval("execute('colorscheme black-atom-jpn-koyo-light')");
    let foreign = RunningNeovim::start(socket_root, 999_997, home, xdg_config, xdg_data);
    foreign.eval("execute('colorscheme desert')");
    assert_eq!(neovim.eval(LOADED_GUTTER), "0");

    let mut config = get_config();
    let nvim = config.apps.get_mut(&AppName::Nvim).unwrap();
    nvim.settings.as_mut().unwrap().dark_gutter = true;
    save_config(config).unwrap();
    let saved = block_on(reload_nvim());
    assert_eq!(saved.status, UpdateStatus::Done, "{saved:?}");
    assert_eq!(neovim.eval(LOADED_GUTTER), "1");
    assert_eq!(neovim.eval("g:colors_name"), THEME);
    assert_eq!(own.eval(LOADED_GUTTER), "1");
    assert_eq!(own.eval("g:colors_name"), "black-atom-jpn-koyo-light");
    assert_eq!(foreign.eval("g:colors_name"), "desert");
}

const STARTUP_THEME: &str = "black-atom-jpn-koyo-dark";
const OWN_THEME: &str = "black-atom-jpn-koyo-light";

/// A machine whose process environment points every child process at a
/// tempdir, so nothing reaches the real home.
struct Machine {
    home: tempfile::TempDir,
    _sockets: tempfile::TempDir,
    sockets: PathBuf,
    _env: MutexGuard<'static, ()>,
}

impl Machine {
    fn new() -> Self {
        let env = env_lock();
        // Short, because a socket path has a length limit. `TMPDIR` is not
        // consulted: an earlier test leaves it pointing at a deleted directory.
        let base = Path::new("/tmp").canonicalize().unwrap();
        let home = tempfile::TempDir::new_in(&base).unwrap();
        let sockets = tempfile::TempDir::new_in(&base).unwrap();
        std::env::set_var("HOME", home.path());
        std::env::set_var("XDG_CONFIG_HOME", home.path().join(".config"));
        std::env::set_var("XDG_DATA_HOME", home.path().join(".local/share"));
        std::env::set_var("XDG_STATE_HOME", home.path().join(".local/state"));
        std::env::set_var("XDG_CACHE_HOME", home.path().join(".cache"));
        std::env::set_var("TMPDIR", sockets.path());
        let sockets_path = sockets.path().to_path_buf();
        Self {
            home,
            _sockets: sockets,
            sockets: sockets_path,
            _env: env,
        }
    }

    fn nvim_dir(&self) -> PathBuf {
        self.home.path().join(".config/nvim")
    }

    /// Plant a file of the user's own Neovim config.
    fn plant(&self, relative: &str, content: &str) {
        write_file(&self.nvim_dir().join(relative), content);
    }

    /// The same chain `livery setup --yes` runs in core: enable what is found,
    /// link its themes, apply a theme and record it. The stored options are
    /// off their defaults, so Neovim reading them is observable.
    fn run_setup(&self) {
        use livery_core::config::commands::{get_config, save_config, set_active_theme};
        use livery_core::themes::catalog;
        use livery_core::updaters::{update_app, ThemeContext};

        unpack::ensure_unpacked().unwrap();
        let mut config = get_config();
        let options = config
            .apps
            .get_mut(&AppName::Nvim)
            .unwrap()
            .settings
            .as_mut()
            .unwrap();
        options.dark_gutter = true;
        options.gutter_padding = 2;
        options.ending_tildes = true;
        save_config(config).unwrap();

        let found: Vec<AppName> = block_on(detect::detect_apps())
            .iter()
            .filter(|detection| detection.found)
            .map(|detection| detection.app)
            .collect();
        assert!(
            found.contains(&AppName::Nvim),
            "Neovim is on PATH: {found:?}"
        );
        let mut config = get_config();
        for app in &found {
            config.apps.get_mut(app).unwrap().enabled = true;
        }
        save_config(config).unwrap();

        for app in &found {
            if provisioning(*app) == ThemeProvisioning::Linked {
                let linked = block_on(themes::link_app_themes(*app));
                assert_eq!(linked.status, UpdateStatus::Done, "{linked:?}");
            }
        }

        let theme = catalog::find(STARTUP_THEME).unwrap();
        for app in &found {
            let result = block_on(update_app(
                *app,
                ThemeContext {
                    theme_key: theme.key.clone(),
                    appearance: theme.appearance.clone(),
                    collection_key: theme.collection_key.clone(),
                    theme_label: Some(theme.label.clone()),
                },
            ));
            assert_ne!(result.status, UpdateStatus::Error, "{result:?}");
        }
        set_active_theme(STARTUP_THEME).unwrap();
    }

    /// Start Neovim on the user's own config, as a user would, and read back
    /// the theme it opened in and the options it resolved.
    fn start_neovim(&self) -> serde_json::Value {
        let root = self.home.path();
        let output = Command::new("nvim")
            .env("HOME", root)
            .env("XDG_CONFIG_HOME", root.join(".config"))
            .env("XDG_DATA_HOME", root.join(".local/share"))
            .env("XDG_STATE_HOME", root.join(".local/state"))
            .env("XDG_CACHE_HOME", root.join(".cache"))
            .env("TMPDIR", &self.sockets)
            .env_remove("VIMINIT")
            .args([
                "--headless",
                "-c",
                "lua io.write(vim.json.encode({ colors_name = vim.g.colors_name or vim.NIL, options = require('black-atom.config').resolve() }))",
                "-c",
                "qa!",
            ])
            .output()
            .expect("failed to run nvim");
        assert!(
            output.status.success(),
            "nvim exited {:?}: {}",
            output.status.code(),
            String::from_utf8_lossy(&output.stderr)
        );
        serde_json::from_slice(&output.stdout).unwrap_or_else(|e| {
            panic!(
                "unparseable output ({e}): {}",
                String::from_utf8_lossy(&output.stdout)
            )
        })
    }

    /// What the search reports, as kind, path below the Neovim config, line.
    fn overrides(&self) -> Vec<(&'static str, String, u32)> {
        use livery_core::updaters::nvim_overrides::{find_nvim_overrides, NvimOverrideKind};

        find_nvim_overrides()
            .into_iter()
            .map(|found| {
                let kind = match found.kind {
                    NvimOverrideKind::Options => "options",
                    NvimOverrideKind::Colorscheme => "colorscheme",
                };
                let file = Path::new(&found.file)
                    .strip_prefix(self.nvim_dir())
                    .unwrap()
                    .display()
                    .to_string();
                (kind, file, found.line)
            })
            .collect()
    }

    /// Every file of the user's Neovim config with its bytes.
    fn nvim_files(&self) -> BTreeMap<String, Vec<u8>> {
        let dir = self.nvim_dir();
        if !dir.exists() {
            return BTreeMap::new();
        }
        walk_names(&dir)
            .into_iter()
            .map(|name| {
                let bytes = std::fs::read(dir.join(&name)).unwrap();
                (name, bytes)
            })
            .collect()
    }
}

macro_rules! machine_or_skip {
    () => {{
        let has_nvim = std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
            .any(|dir| dir.join("nvim").is_file());
        if !has_nvim {
            eprintln!("skipped: nvim not on PATH");
            return;
        }
        Machine::new()
    }};
}

fn assert_stored_options_reached(neovim: &serde_json::Value, dark_gutter: bool) {
    let options = &neovim["options"];
    assert_eq!(options["dark_gutter"], dark_gutter, "{options}");
    assert_eq!(options["gutter_padding"], 2, "{options}");
    assert_eq!(options["ending_tildes"], true, "{options}");
}

/// Puts the plugin on the runtime path before the user's colorscheme line
/// runs, as a plugin manager does.
const PLUGIN_ON_RTP: &str =
    "vim.opt.runtimepath:prepend(vim.fn.stdpath(\"data\") .. \"/site/pack/black-atom/start/black-atom\")\n";

#[test]
fn neovim_without_a_config_directory_opens_in_the_active_theme() {
    let machine = machine_or_skip!();
    machine.run_setup();

    assert!(
        !machine.nvim_dir().exists(),
        "setup created a Neovim config"
    );
    let neovim = machine.start_neovim();
    assert_eq!(neovim["colors_name"], STARTUP_THEME);
    assert_stored_options_reached(&neovim, true);
    assert_eq!(machine.overrides(), []);
}

#[test]
fn neovim_with_a_minimal_init_opens_in_the_active_theme() {
    let machine = machine_or_skip!();
    machine.plant("init.lua", "vim.opt.number = true\n");
    let before = machine.nvim_files();
    machine.run_setup();

    assert_eq!(machine.nvim_files(), before);
    let neovim = machine.start_neovim();
    assert_eq!(neovim["colors_name"], STARTUP_THEME);
    assert_stored_options_reached(&neovim, true);
    assert_eq!(machine.overrides(), []);
}

#[test]
fn a_users_own_options_and_colorscheme_win_over_the_stored_ones() {
    let machine = machine_or_skip!();
    machine.plant(
        "init.lua",
        &format!(
            "{PLUGIN_ON_RTP}vim.g.black_atom_core_config = {{ dark_gutter = false }}\nvim.cmd.colorscheme(\"{OWN_THEME}\")\n"
        ),
    );
    machine.plant("lua/user/theme.lua", "vim.cmd.colorscheme(vim.g.picked)\n");
    let before = machine.nvim_files();
    machine.run_setup();

    assert_eq!(machine.nvim_files(), before);
    let neovim = machine.start_neovim();
    assert_eq!(neovim["colors_name"], OWN_THEME);
    assert_stored_options_reached(&neovim, false);
    assert_eq!(
        machine.overrides(),
        [
            ("options", "init.lua".to_string(), 2),
            ("colorscheme", "init.lua".to_string(), 3),
        ]
    );
}

#[test]
fn a_leftover_colorscheme_line_picks_the_theme_and_the_stored_options_apply() {
    let machine = machine_or_skip!();
    machine.plant(
        "init.lua",
        &format!("{PLUGIN_ON_RTP}vim.cmd.colorscheme(\"{OWN_THEME}\")\n"),
    );
    let before = machine.nvim_files();
    machine.run_setup();

    assert_eq!(machine.nvim_files(), before);
    let neovim = machine.start_neovim();
    assert_eq!(neovim["colors_name"], OWN_THEME);
    assert_stored_options_reached(&neovim, true);
    assert_eq!(
        machine.overrides(),
        [("colorscheme", "init.lua".to_string(), 2)]
    );
}
