# Livery backend

The Rust backend is the executor. Every OS operation lives here: file I/O, downloads, process
signals, socket communication.

## Modules

- `src/lib.rs` — Tauri command registration and the tauri-specta builder
- `src/config/` — `types.rs` (`AppName`, `AppConfig`, `Config`), `defaults.rs`, `commands.rs`,
  `io.rs` (disk I/O, tilde expansion, default merging)
- `src/themes/` — theme registry, manifest, download and extraction, symlinks, app detection
- `src/updaters/` — `mod.rs` holds `update_app`, `update_system_appearance`, and the dispatcher;
  one module per app next to it
- `src/updaters/file_ops/` — `text.rs`, `yaml.rs`, `jsonc.rs`, `managed_block.rs`, plus `secure.rs`
  for the path guard and `verify.rs`
- `src/bin/perf_benchmark.rs` — benchmark binary

The frontend calls `update_app(app, theme_key, appearance, collection_key)`. The dispatcher reads
that app's config, builds the template variables, and routes to the per-app function. No per-app
branching exists on the frontend.

## Conventions

Commands validate that a path is under `$HOME` before writing. Writes are atomic through
`tempfile::NamedTempFile` and `persist()`. Paths arriving from the frontend go through
`shellexpand::tilde`.

Unit tests live in `#[cfg(test)] mod tests` inside the source file. File operations get fixtures,
see the `backend-testing` skill.

`tests/setup_smoke.rs` is the end-to-end suite. It points `$HOME` at a tempdir and serves theme
tarballs from a local listener, so it never touches a real config. Extend that file for new setup
scenarios rather than adding a parallel suite: `$HOME` is process-global and the scenario has to
stay sequential.

## Bindings

`cargo test` regenerates `livery/src/bindings.ts` through tauri-specta. Adding or changing a command
means running it before the frontend can see the new signature.

## Adding an updater

1. Add the `AppName` variant in `src/config/types.rs` and its `as_str()` arm
2. Add the default config in `src/config/defaults.rs`
3. Write the updater module in `src/updaters/`
4. Register it in `src/updaters/mod.rs`
5. Add fixtures under `tests/fixtures/` and write the tests
6. Run `cargo test` to regenerate the bindings
