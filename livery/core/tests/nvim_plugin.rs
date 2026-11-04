//! The Neovim plugin's startup behavior, driven through headless Neovim in a
//! fixture home. `-u NONE` skips `plugin/` of packages, so each run uses a real
//! init file and the adapter linked in as a start package.

use std::path::{Path, PathBuf};
use std::process::Command;

use livery_core::config::types::{
    NvimDiagnostics, NvimSettings, NvimStyle, NvimStyles, NvimSyntax,
};
use serde_json::{json, Value};
use tempfile::TempDir;

const THEME: &str = "black-atom-jpn-koyo-dark";

fn which_nvim() -> Option<PathBuf> {
    let path_var = std::env::var_os("PATH")?;
    std::env::split_paths(&path_var)
        .map(|dir| dir.join("nvim"))
        .find(|candidate| candidate.is_file())
}

struct Fixture {
    home: TempDir,
}

impl Fixture {
    fn new() -> Self {
        let home = TempDir::new().unwrap();
        let adapter = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../adapters/nvim")
            .canonicalize()
            .unwrap();
        let start = home.path().join("data/nvim/site/pack/black-atom/start");
        std::fs::create_dir_all(&start).unwrap();
        std::os::unix::fs::symlink(adapter, start.join("black-atom")).unwrap();
        Self { home }
    }

    fn config_json(&self, contents: &str) {
        let dir = self.home.path().join("config/black-atom/livery");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("config.json"), contents).unwrap();
    }

    fn init_lua(&self, contents: &str) {
        std::fs::write(self.home.path().join("init.lua"), contents).unwrap();
    }

    /// Start Neovim, then report the state the plugin left behind. Warnings
    /// raised through `vim.notify` while starting are collected, not printed.
    fn run(&self) -> Value {
        let root = self.home.path();
        let init = root.join("init.lua");
        if !init.exists() {
            self.init_lua("");
        }
        let prelude = "_G.notes = {}\nvim.notify = function(msg) table.insert(_G.notes, msg) end\n";
        let user = std::fs::read_to_string(&init).unwrap();
        if !user.starts_with(prelude) {
            std::fs::write(&init, format!("{prelude}{user}")).unwrap();
        }

        let output = Command::new(which_nvim().unwrap())
            .env("HOME", root)
            .env("XDG_CONFIG_HOME", root.join("config"))
            .env("XDG_DATA_HOME", root.join("data"))
            .env("XDG_STATE_HOME", root.join("state"))
            .env("XDG_CACHE_HOME", root.join("cache"))
            .env_remove("VIMINIT")
            .args([
                "--headless",
                "-u",
                init.to_str().unwrap(),
                "-c",
                "lua io.write(vim.json.encode({ colors_name = vim.g.colors_name or vim.NIL, notes = _G.notes, config = require('black-atom.config').resolve(), defaults = require('black-atom.config').defaults, function_call_bold = vim.api.nvim_get_hl(0, { name = '@function.call' }).bold or false }))",
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
}

macro_rules! fixture_or_skip {
    () => {{
        if which_nvim().is_none() {
            eprintln!("skipped: nvim not on PATH");
            return;
        }
        Fixture::new()
    }};
}

#[test]
fn no_file_leaves_defaults_and_no_theme() {
    let fx = fixture_or_skip!();
    let out = fx.run();
    assert_eq!(out["colors_name"], Value::Null);
    assert_eq!(out["notes"], json!([]));
    assert_eq!(out["config"]["styles"]["dark_gutter"], false);
    assert_eq!(out["config"]["styles"]["gutter_padding"], 0);
}

#[test]
fn broken_file_warns_once_and_keeps_defaults() {
    let fx = fixture_or_skip!();
    fx.config_json("{ not json");
    let out = fx.run();
    assert_eq!(out["colors_name"], Value::Null);
    assert_eq!(out["config"]["styles"]["dark_gutter"], false);
    let notes = out["notes"].as_array().unwrap();
    assert_eq!(notes.len(), 1, "{notes:?}");
    assert!(notes[0].as_str().unwrap().contains("invalid JSON"));
}

#[test]
fn config_json_alone_sets_options_and_theme() {
    let fx = fixture_or_skip!();
    fx.config_json(&format!(
        r#"{{"active_theme":"{THEME}","apps":{{"nvim":{{"enabled":true,"settings":{{"styles":{{"dark_gutter":true,"gutter_padding":2}}}}}}}}}}"#
    ));
    let out = fx.run();
    assert_eq!(out["colors_name"], THEME);
    assert_eq!(out["config"]["styles"]["dark_gutter"], true);
    assert_eq!(out["config"]["styles"]["gutter_padding"], 2);
    assert_eq!(out["config"]["styles"]["dark_floats"], true);
}

#[test]
fn null_and_empty_values_leave_defaults() {
    let fx = fixture_or_skip!();
    fx.config_json(r#"{"active_theme":null,"apps":{"nvim":{"settings":null}}}"#);
    let out = fx.run();
    assert_eq!(out["colors_name"], Value::Null);
    assert_eq!(out["notes"], json!([]));
    assert_eq!(out["config"]["styles"]["dark_gutter"], false);

    fx.config_json(r#"{"apps":{"nvim":{"settings":{"styles":{}}}}}"#);
    let out = fx.run();
    assert_eq!(out["config"]["styles"]["dark_floats"], true);
}

#[test]
fn vim_g_overrides_only_the_keys_it_names() {
    let fx = fixture_or_skip!();
    fx.config_json(
        r#"{"apps":{"nvim":{"settings":{"term_colors":false,"styles":{"dark_gutter":true,"gutter_padding":3}}}}}"#,
    );
    fx.init_lua("vim.g.black_atom_core_config = { styles = { dark_gutter = false } }");
    let out = fx.run();
    assert_eq!(out["config"]["styles"]["dark_gutter"], false);
    assert_eq!(out["config"]["styles"]["gutter_padding"], 3);
    assert_eq!(out["config"]["term_colors"], false);
}

#[test]
fn empty_user_config_gets_the_active_theme() {
    let fx = fixture_or_skip!();
    fx.config_json(&format!(r#"{{"active_theme":"{THEME}"}}"#));
    fx.init_lua("");
    let out = fx.run();
    assert_eq!(out["colors_name"], THEME);
    assert_eq!(out["notes"], json!([]));
}

#[test]
fn a_colorscheme_the_user_set_stays() {
    let fx = fixture_or_skip!();
    fx.config_json(&format!(r#"{{"active_theme":"{THEME}"}}"#));
    fx.init_lua("vim.cmd.colorscheme('black-atom-mono-dark')");
    let out = fx.run();
    assert_eq!(out["colors_name"], "black-atom-mono-dark");
}

#[test]
fn a_bad_theme_name_warns_and_starts_anyway() {
    let fx = fixture_or_skip!();
    fx.config_json(r#"{"active_theme":"black-atom-does-not-exist"}"#);
    let out = fx.run();
    assert_eq!(out["colors_name"], Value::Null);
    let notes = out["notes"].as_array().unwrap();
    assert_eq!(notes.len(), 1, "{notes:?}");
    assert!(notes[0]
        .as_str()
        .unwrap()
        .contains("black-atom-does-not-exist"));
}

#[test]
fn wrong_shape_layers_resolve_to_defaults() {
    let fx = fixture_or_skip!();
    for contents in [
        r#"{"apps":{"nvim":{"settings":[1,2]}}}"#,
        r#"{"apps":{"nvim":{"settings":"loud"}}}"#,
        "[]",
    ] {
        fx.config_json(contents);
        let out = fx.run();
        assert_eq!(out["colors_name"], Value::Null, "{contents}");
        assert_eq!(out["config"]["styles"]["dark_gutter"], false, "{contents}");
        assert_eq!(out["config"]["styles"]["dark_floats"], true, "{contents}");
        assert_eq!(out["config"]["term_colors"], true, "{contents}");
    }
}

fn config_with_settings(settings: &NvimSettings) -> String {
    json!({
        "active_theme": THEME,
        "apps": { "nvim": { "enabled": true, "settings": settings } },
    })
    .to_string()
}

/// `NvimSettings::default()` claims to mirror the plugin's `M.defaults`, and
/// every config Livery stores carries it, so storing it must change nothing.
#[test]
fn stored_default_settings_resolve_to_the_plugin_defaults() {
    let fx = fixture_or_skip!();
    fx.config_json(&config_with_settings(&NvimSettings::default()));
    let out = fx.run();
    assert_eq!(out["colors_name"], THEME);
    assert_eq!(out["config"], out["defaults"]);
    assert_eq!(
        out["function_call_bold"], true,
        "stored off flags strip the bold highlights hardcode"
    );
}

#[test]
fn stored_settings_round_trip_through_the_plugin() {
    let fx = fixture_or_skip!();
    let on = NvimStyle {
        bold: true,
        italic: true,
    };
    let settings = NvimSettings {
        term_colors: false,
        styles: NvimStyles {
            transparency: "full".to_string(),
            ending_tildes: true,
            cmp_kind_color_mode: "fg".to_string(),
            dark_sidebars: false,
            dark_floats: false,
            dark_gutter: true,
            gutter_padding: 3,
            diagnostics: NvimDiagnostics {
                undercurl: true,
                background: true,
            },
            syntax: NvimSyntax {
                comments: on,
                keywords: on,
                functions: on,
                strings: on,
                variables: on,
                messages: on,
            },
        },
    };
    fx.config_json(&config_with_settings(&settings));
    let out = fx.run();
    assert_eq!(out["config"], serde_json::to_value(&settings).unwrap());
}

#[test]
fn stored_off_flags_apply_only_where_the_defaults_declare_them() {
    let fx = fixture_or_skip!();
    fx.config_json(
        r#"{"apps":{"nvim":{"settings":{"styles":{"syntax":{"comments":{"italic":false,"bold":false},"functions":{"bold":false,"italic":true}}}}}}}"#,
    );
    let out = fx.run();
    assert_eq!(
        out["config"]["styles"]["syntax"]["comments"],
        json!({ "italic": false })
    );
    assert_eq!(
        out["config"]["styles"]["syntax"]["functions"],
        json!({ "italic": true })
    );
}

#[test]
fn vim_g_can_still_turn_a_flag_off() {
    let fx = fixture_or_skip!();
    fx.init_lua(
        "vim.g.black_atom_core_config = { styles = { syntax = { functions = { bold = false } } } }",
    );
    let out = fx.run();
    assert_eq!(
        out["config"]["styles"]["syntax"]["functions"],
        json!({ "bold": false })
    );
}
