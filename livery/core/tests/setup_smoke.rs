//! Hermetic end-to-end smoke test of the adapter setup chain.
//!
//! Runs the real core functions — get_config → detect_apps → save_config →
//! download_theme → link_app_themes → verify_app_path → get_themes_status —
//! against a tempdir `$HOME` with planted app configs, downloading from a
//! local listener that serves in-memory fixture tarballs. One test function:
//! `$HOME` and `LIVERY_THEMES_BASE_URL` are process-global, so the scenario
//! must stay sequential.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::Path;

use tokio::runtime::Runtime;

use livery_core::config::types::AppName;
use livery_core::themes::registry::{provisioning, ThemeProvisioning};
use livery_core::themes::{commands as themes, detect, manifest};
use livery_core::updaters::UpdateStatus;

fn runtime() -> &'static Runtime {
    static RUNTIME: std::sync::OnceLock<Runtime> = std::sync::OnceLock::new();
    RUNTIME.get_or_init(|| Runtime::new().unwrap())
}

fn block_on<F: std::future::Future>(future: F) -> F::Output {
    runtime().block_on(future)
}

fn gz_tarball(entries: &[(&str, &str)]) -> Vec<u8> {
    let encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
    let mut builder = tar::Builder::new(encoder);
    for (path, content) in entries {
        let mut header = tar::Header::new_gnu();
        header.set_size(content.len() as u64);
        header.set_mode(0o644);
        header.set_cksum();
        builder
            .append_data(&mut header, path, content.as_bytes())
            .unwrap();
    }
    builder.into_inner().unwrap().finish().unwrap()
}

/// Adapter-repo tarballs matching each layout the extractor understands.
fn fixture_tarballs() -> HashMap<&'static str, Vec<u8>> {
    let mut tarballs = HashMap::new();
    for repo in ["ghostty", "tmux"] {
        tarballs.insert(
            repo,
            gz_tarball(
                &[
                    (
                        format!("{repo}-HEAD/themes/jpn/black-atom-jpn-koyo-yoru.conf").as_str(),
                        "# theme",
                    ),
                    (
                        format!("{repo}-HEAD/themes/default/black-atom-default-dark.conf").as_str(),
                        "# theme",
                    ),
                ]
                .iter()
                .map(|(p, c)| (p.as_ref(), *c))
                .collect::<Vec<(&str, &str)>>()
                .as_slice(),
            ),
        );
    }
    tarballs.insert(
        "zed",
        gz_tarball(&[(
            "zed-HEAD/themes/jpn/black-atom-jpn-koyo-yoru.json",
            "{\"name\":\"Black Atom — JPN Koyo Yoru\"}",
        )]),
    );
    tarballs.insert(
        "lazygit",
        gz_tarball(&[(
            "lazygit-HEAD/themes/jpn/black-atom-jpn-koyo-yoru.yml",
            "gui:\n  theme:\n    activeBorderColor:\n      - '#c47a4a'\n",
        )]),
    );
    tarballs.insert(
        "herdr",
        gz_tarball(&[(
            "herdr-HEAD/themes/jpn/black-atom-jpn-koyo-yoru.toml",
            "# BEGIN BLACK ATOM LIVERY THEME\n[theme]\nname = \"catppuccin\"\n\n[theme.custom]\naccent = \"#e49e22\"\n# END BLACK ATOM LIVERY THEME\n",
        )]),
    );
    tarballs.insert(
        "obsidian",
        gz_tarball(&[
            (
                "obsidian-HEAD/themes/jpn/black-atom-jpn-koyo-hiru.css",
                "body{}",
            ),
            ("obsidian-HEAD/theme.css", "body{}"),
            (
                "obsidian-HEAD/manifest.json",
                "{\"name\":\"Black Atom\",\"version\":\"0.1.0\"}",
            ),
        ]),
    );
    tarballs
}

/// Minimal HTTP/1.1 listener: `GET /<repo>/tar.gz/HEAD` → fixture tarball.
fn serve_fixtures(listener: TcpListener, tarballs: HashMap<&'static str, Vec<u8>>) {
    std::thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { continue };
            let mut request = Vec::new();
            let mut buf = [0u8; 1024];
            while !request.windows(4).any(|w| w == b"\r\n\r\n") {
                match stream.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => request.extend_from_slice(&buf[..n]),
                }
            }
            let request_line = String::from_utf8_lossy(&request);
            let path = request_line
                .split_whitespace()
                .nth(1)
                .unwrap_or("")
                .to_string();
            let repo = path
                .strip_prefix('/')
                .and_then(|p| p.strip_suffix("/tar.gz/HEAD"));
            let response = match repo.and_then(|r| tarballs.get(r)) {
                Some(body) => {
                    let mut response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: application/gzip\r\nEtag: \"fixture\"\r\nConnection: close\r\n\r\n",
                        body.len()
                    )
                    .into_bytes();
                    response.extend_from_slice(body);
                    response
                }
                None => b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
                    .to_vec(),
            };
            let _ = stream.write_all(&response);
        }
    });
}

fn write_file(path: &Path, content: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, content).unwrap();
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

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let base_url = format!("http://{}", listener.local_addr().unwrap());
    std::env::set_var("LIVERY_THEMES_BASE_URL", &base_url);
    serve_fixtures(listener, fixture_tarballs());

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

    // 4. Pre-plant a stale nvim download to prove the self-heal.
    let managed_root = home.join(".config/black-atom/themes");
    write_file(&managed_root.join("nvim/black-atom-stub.lua"), "-- stub");
    manifest::upsert_entry(
        &managed_root,
        "nvim",
        manifest::ManifestEntry {
            etag: None,
            fetched_at_epoch: 1,
            file_count: 1,
        },
    )
    .unwrap();

    // 5. Download every non-External adapter from the fixture listener.
    for app in AppName::all() {
        if provisioning(*app) == ThemeProvisioning::External {
            continue;
        }
        let result = block_on(themes::download_theme(*app));
        assert!(
            matches!(result.status, UpdateStatus::Done),
            "download {} failed: {:?}",
            app.as_str(),
            result.message
        );
        if *app == AppName::Obsidian {
            // Exact: the nested collection theme plus the vault-installable
            // root pair. A dropped nested theme would still leave the pair.
            assert_eq!(result.file_count, Some(3), "obsidian extraction count");
        } else {
            assert!(result.file_count.unwrap_or(0) > 0);
        }
    }
    // External adapters have nothing to fetch — a skip, not a failure.
    let nvim_download = block_on(themes::download_theme(AppName::Nvim));
    assert!(matches!(nvim_download.status, UpdateStatus::Skipped));

    // 6. Status: every app carries its class, the stale nvim download is gone.
    let status = block_on(themes::get_themes_status());
    assert_eq!(status.adapters.len(), AppName::all().len());
    assert!(status.any_downloaded);
    for (app, adapter) in &status.adapters {
        let external = provisioning(*app) == ThemeProvisioning::External;
        assert_eq!(adapter.provisioning, provisioning(*app));
        assert_eq!(adapter.downloaded, !external, "{}", app.as_str());
    }
    assert!(!managed_root.join("nvim").exists(), "stale nvim dir healed");

    // 7. Link the Linked adapters, then check the placements on disk.
    for app in [
        AppName::Ghostty,
        AppName::Zed,
        AppName::Tmux,
        AppName::Obsidian,
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
    // Merged adapters consume the managed dir directly — linking is a skip.
    for app in [AppName::Lazygit, AppName::Herdr] {
        let link = block_on(themes::link_app_themes(app));
        assert!(matches!(link.status, UpdateStatus::Skipped));
    }

    // 8. Verify lands truthful per adapter.
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
}
