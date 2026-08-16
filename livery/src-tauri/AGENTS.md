# Backend (Rust / Tauri)

The Rust backend is the **executor** — all OS operations (file I/O, process signals, socket
communication) happen here. TypeScript never touches the filesystem directly.

## Module Structure

```
src-tauri/src/
  lib.rs                    # Tauri command registration
  bin/
    perf_benchmark.rs       # Performance benchmark binary (deno task test:perf-benchmark)
  config/
    types.rs                # AppName enum, AppConfig, Config structs
    defaults.rs             # Config::default() — pattern defaults per app
    commands.rs             # get_config, save_config Tauri commands
    io.rs                   # Disk I/O, tilde expansion, default merging
  updaters/
    mod.rs                  # update_app + update_system_appearance commands, UpdateResult, dispatcher
    file_ops/
      text.rs               # patch_text_file — regex replace with template variables
      yaml.rs               # patch_yaml_file — lossless YAML merge (yaml-edit + yaml_serde)
      jsonc.rs              # patch_jsonc_file — JSONC CST editing (jsonc-parser, format-preserving)
    ghostty.rs              # ghostty update + reload (SIGUSR2)
    nvim.rs                 # nvim update + reload (socket)
    tmux.rs                 # tmux update + reload (source-file)
    lazygit.rs              # lazygit update (YAML merge, no reload)
    zed.rs                  # zed update (JSONC patching, no reload — auto-watches)
    obsidian.rs             # obsidian update (JSONC patching + URI reload)
    system_appearance.rs    # macOS/Linux system dark/light mode toggle
```

## Conventions

- Every Tauri command validates paths are under `$HOME` before writing
- Atomic writes via `tempfile::NamedTempFile` + `persist()`
- Tilde expansion (`shellexpand::tilde`) on paths received from the frontend
- Tests use `#[cfg(test)] mod tests` within source files
- Fixture-based testing for file operations — see the `backend-testing` skill

## Updater Architecture

The frontend calls a single Tauri command: `update_app(app, theme_key, appearance, collection_key)`.
The backend dispatcher in `updaters/mod.rs` reads the app's config, builds template variables,
and routes to the per-app update function. No per-app logic exists on the frontend.

## Adding a New Updater

1. Add variant to `AppName` enum in `config/types.rs` and its `as_str()` match arm
2. Add default config in `config/defaults.rs`
3. TypeScript bindings update automatically via tauri-specta on next dev build
4. Create a Rust updater module in `updaters/` (e.g., `updaters/foo.rs`)
5. Add the module and dispatch arm in `updaters/mod.rs`
6. Add fixture files in `tests/fixtures/` and write tests
