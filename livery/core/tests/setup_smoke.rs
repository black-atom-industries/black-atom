//! Hermetic end-to-end smoke test of the adapter setup chain.
//!
//! Runs the real core functions — ensure_unpacked → get_config → detect_apps
//! → save_config → link_app_themes → verify_app_path → get_app_status —
//! against a tempdir `$HOME` with planted app configs. One test function:
//! `$HOME` and the `XDG_*` variables are process-global, so the scenario
//! must stay sequential.

use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Duration;

use tokio::runtime::Runtime;

use livery_core::config::types::AppName;
use livery_core::paths;
use livery_core::themes::registry::{provisioning, ThemeProvisioning};
use livery_core::themes::{commands as themes, detect, unpack};
use livery_core::updaters::UpdateStatus;

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
    let fake_home = tempfile::TempDir::new().unwrap();
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
        managed_root.join("rex/black-atom-jpn-koyo-dark"),
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
    fn start(socket_root: &Path, home: &Path, xdg_config: &Path, xdg_data: &Path) -> Self {
        let dir = socket_root.join("nvim.fixture/0");
        std::fs::create_dir_all(&dir).unwrap();
        let socket = dir.join("nvim.999999.0");
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
const LOADED_GUTTER: &str =
    "luaeval(\"require('black-atom').config.styles.dark_gutter and 1 or 0\")";

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
    assert_eq!(no_theme.status, UpdateStatus::Skipped, "{no_theme:?}");

    set_active_theme(THEME).unwrap();
    let no_instances = block_on(reload_nvim());
    assert_eq!(no_instances.status, UpdateStatus::Done, "{no_instances:?}");

    if !std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
        .any(|dir| dir.join("nvim").is_file())
    {
        eprintln!("skipped: nvim not on PATH");
        return;
    }

    let neovim = RunningNeovim::start(socket_root, home, xdg_config, xdg_data);
    assert_eq!(neovim.eval("g:colors_name"), THEME);
    assert_eq!(neovim.eval(LOADED_GUTTER), "0");

    let mut config = get_config();
    let nvim = config.apps.get_mut(&AppName::Nvim).unwrap();
    nvim.settings.as_mut().unwrap().styles.dark_gutter = true;
    save_config(config).unwrap();
    let saved = block_on(reload_nvim());
    assert_eq!(saved.status, UpdateStatus::Done, "{saved:?}");
    assert_eq!(neovim.eval(LOADED_GUTTER), "1");
}
