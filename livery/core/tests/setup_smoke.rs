//! Hermetic end-to-end smoke test of the adapter setup chain.
//!
//! Runs the real core functions — ensure_unpacked → get_config → detect_apps
//! → save_config → link_app_themes → verify_app_path → get_app_status —
//! against a tempdir `$HOME` with planted app configs. One test function:
//! `$HOME` and the `XDG_*` variables are process-global, so the scenario
//! must stay sequential.

use std::path::Path;

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
    let target = std::fs::read_link(link)
        .unwrap_or_else(|e| panic!("expected symlink at {}: {e}", link.display()));
    assert!(
        target.starts_with(managed_root),
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

    // Plant app configs: ghostty/zed/tmux exist, plus an obsidian vault.
    write_file(
        &home.join(".config/ghostty/config"),
        "theme = black-atom-default-dark.conf\n",
    );
    write_file(&home.join(".config/zed/settings.json"), "{}\n");
    write_file(
        &home.join(".config/tmux/tmux.conf"),
        "source-file ~/.config/tmux/themes/black-atom-jpn-koyo-yoru.conf\n",
    );
    write_file(
        &home.join(".config/herdr/config.toml"),
        "# BEGIN BLACK ATOM LIVERY THEME\n[theme]\nname = \"terminal\"\n# END BLACK ATOM LIVERY THEME\n",
    );
    let vault_appearance = home.join("vault/.obsidian/appearance.json");
    write_file(&vault_appearance, "{\"cssTheme\":\"Black Atom\"}\n");

    // 0. Startup unpack: the embedded adapter output lands under the themes
    // root before anything else runs.
    let managed_root = paths::themes_root();
    let report = unpack::ensure_unpacked().unwrap();
    assert!(report.unpacked, "first run must write the embedded themes");
    assert_eq!(report.adapters, 10);
    assert!(report.files > 200, "unpacked only {} files", report.files);

    for (adapter, file) in [
        ("ghostty", "default/black-atom-default-dark.conf"),
        ("tmux", "jpn/black-atom-jpn-koyo-yoru.conf"),
        ("zed", "jpn/black-atom-jpn-koyo-yoru.json"),
        ("obsidian", "jpn/black-atom-jpn-koyo-yoru.css"),
        ("obsidian", "theme.css"),
        ("obsidian", "manifest.json"),
        ("nvim", "colors/black-atom-jpn-koyo-yoru.lua"),
        ("nvim", "lua/black-atom/init.lua"),
        ("niri", "default/black-atom-default-dark.kdl"),
        ("waybar", "default/black-atom-default-dark.css"),
        ("wezterm", "default/black-atom-default-dark.toml"),
        ("herdr", "default/black-atom-default-dark.toml"),
        ("lazygit", "default/black-atom-default-dark.yml"),
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

    // 2. Conservative detection: planted configs found, everything else not.
    let detections = block_on(detect::detect_apps());
    let mut found: Vec<&str> = detections
        .iter()
        .filter(|d| d.found)
        .map(|d| d.app.as_str())
        .collect();
    found.sort_unstable();
    assert_eq!(found, ["ghostty", "herdr", "tmux", "zed"], "detected apps");
    let obsidian = detections
        .iter()
        .find(|d| d.app == AppName::Obsidian)
        .unwrap();
    assert!(
        !obsidian.found && obsidian.config_path.is_empty(),
        "obsidian must never auto-detect without a vault path"
    );

    // 3. Enable the detected apps + lazygit, supply obsidian's vault path.
    for (app, app_config) in config.apps.iter_mut() {
        match app {
            AppName::Ghostty | AppName::Zed | AppName::Tmux | AppName::Lazygit | AppName::Herdr => {
                app_config.enabled = true;
            }
            AppName::Obsidian => {
                app_config.enabled = true;
                app_config.config_path = vault_appearance.to_string_lossy().to_string();
            }
            _ => {}
        }
    }
    livery_core::config::commands::save_config(config).unwrap();

    // 4. Link the Linked adapters, then check the placements on disk.
    for app in [
        AppName::Ghostty,
        AppName::Zed,
        AppName::Tmux,
        AppName::Obsidian,
        AppName::Nvim,
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
        home.join(".config/ghostty/themes/black-atom-jpn-koyo-yoru.conf"),
        home.join(".config/ghostty/themes/black-atom-default-dark.conf"),
        home.join(".config/tmux/themes/black-atom-jpn-koyo-yoru.conf"),
        home.join(".config/zed/themes/black-atom-jpn-koyo-yoru.json"),
        home.join("vault/.obsidian/themes/Black Atom/theme.css"),
        home.join("vault/.obsidian/themes/Black Atom/manifest.json"),
    ] {
        assert_managed_symlink(&link, &managed_root);
    }
    // nvim gets one directory symlink into the runtimepath instead of
    // per-file links: neovim adds `pack/*/start/*` itself.
    let pack_link = xdg_data.join("nvim/site/pack/black-atom/start/black-atom");
    assert_eq!(
        std::fs::read_link(&pack_link).unwrap(),
        managed_root.join("nvim"),
        "nvim pack dir must point at the unpacked themes"
    );
    assert!(pack_link
        .join("colors/black-atom-jpn-koyo-yoru.lua")
        .is_file());
    assert!(pack_link.join("lua/black-atom/init.lua").is_file());
    // Merged adapters consume the managed dir directly — linking is a skip.
    for app in [AppName::Lazygit, AppName::Herdr] {
        let link = block_on(themes::link_app_themes(app));
        assert!(matches!(link.status, UpdateStatus::Skipped));
    }

    // 5. Status: every app carries its class and its editable fields, and
    // the five Linked adapters now report their placement as wired.
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

    let nvim = block_on(livery_core::updaters::verify_app_path(AppName::Nvim));
    assert!(!nvim.exists, "no nvim config was planted");

    // 7. Settings only get persisted once the Lua block was actually
    // written. A settings_path in a directory that does not exist fails the
    // write, so the stored settings must still be the previous ones.
    let mut config = livery_core::config::commands::get_config();
    let nvim_config = config.apps.get_mut(&AppName::Nvim).unwrap();
    nvim_config.settings_path = Some(
        home.join("no/such/dir/init.lua")
            .to_string_lossy()
            .into_owned(),
    );
    let before = nvim_config.settings.clone();
    livery_core::config::commands::save_config(config).unwrap();

    let mut wanted = before.clone().unwrap_or_default();
    wanted.term_colors = !wanted.term_colors;
    let result = block_on(livery_core::updaters::write_nvim_settings(wanted));
    assert_eq!(
        result.status,
        UpdateStatus::Error,
        "a settings_path in a missing directory must fail"
    );

    let stored = livery_core::config::commands::get_config()
        .apps
        .get(&AppName::Nvim)
        .and_then(|app| app.settings.clone());
    assert_eq!(
        stored, before,
        "a failed settings write must leave the config untouched"
    );
}
