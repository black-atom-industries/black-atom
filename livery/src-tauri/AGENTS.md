# Livery backend

The Rust backend is the executor. Every OS operation lives here: file I/O, process signals,
socket communication.

Repo-wide instructions live in [`AGENTS.md`](../../AGENTS.md); every term is defined in
[`GLOSSARY.md`](../../GLOSSARY.md). Name things with those words.

It is three crates. `livery/core` (`livery_core`) holds the domain logic and depends on no Tauri
crate — `cargo tree -p livery_core -e normal | grep -c tauri` must stay `0`. `livery/src-tauri`
(`livery_lib`) is the Tauri shell: command wrappers, plugins, window setup. `livery/cli`
(`livery-cli`, binary `livery`) is the terminal client, calling `livery_core` directly with no
Tauri wrapper in between.

Every `#[tauri::command]` in `commands.rs` is a thin wrapper over a `livery_core` function of the
same name and signature. The dispatcher in `updaters/mod.rs` reads the app's config and routes to
the per-app function, so no per-app branching exists on the frontend.

## Conventions

Commands validate that a path is under `$HOME` before writing. Writes are atomic through
`tempfile::NamedTempFile` and `persist()`. Paths arriving from the frontend go through
`shellexpand::tilde`.

Unit tests live in `#[cfg(test)] mod tests` inside the source file. File operations get fixtures,
see the `backend-testing` skill.

Two end-to-end suites: `livery/core/tests/setup_smoke.rs` calls the crate functions directly, and
`livery/cli/tests/cli_smoke.rs` spawns the built `livery` binary. Both point `$HOME` and the
`XDG_*` variables at a tempdir, so neither touches a real config. Extend the matching file for new
setup scenarios rather than adding a parallel suite: those variables are process-global and each
scenario has to stay sequential.

## Bindings

`cargo test` regenerates `livery/src/bindings.ts` through tauri-specta. Adding or changing a command
means running it before the frontend can see the new signature.

A binding's JSDoc comes from the doc comment on the wrapper in `commands.rs`, not from the
`livery_core` function behind it.

## Adding an updater

1. Add the `AppName` variant in `livery/core/src/config/types.rs` and its `as_str()` arm
2. Add the default config in `livery/core/src/config/defaults.rs`
3. Write the updater module in `livery/core/src/updaters/`
4. Register it in `livery/core/src/updaters/mod.rs`
5. Add fixtures under `livery/core/tests/fixtures/` and write the tests
6. Run `cargo test` to regenerate the bindings
