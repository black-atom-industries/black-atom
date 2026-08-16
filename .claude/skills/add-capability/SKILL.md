---
name: add-capability
description: Add a livery capability end to end, from core Rust logic through the Tauri command to the frontend query hook. Load when adding a new user-facing action to the livery app, not a new per-app updater (see the updaters guide in `livery/src-tauri/AGENTS.md` for that).
---

# Add Capability

A capability is one user-facing action: a Tauri command backed by a plain Rust function, called
from the frontend through a generated binding. Build it inside-out, core logic first.

## 1. Core logic

Write the logic as a plain function, no `#[tauri::command]`, no Tauri types in the signature.
Today it lives next to the feature it belongs to: `livery/src-tauri/src/config/`,
`livery/src-tauri/src/themes/`, or a new module under `livery/src-tauri/src/updaters/`. Read
`livery/src-tauri/src/lib.rs` and `livery/src-tauri/src/updaters/mod.rs` first to see where
similar logic already sits.

If the function touches files, read the `backend-testing` skill and follow its fixture pattern:
real config fixtures under `livery/src-tauri/tests/fixtures/`, not inline test strings, plus an
idempotency test. Add `#[cfg(test)] mod tests` in the source file for anything else.

Once `livery/core` (crate `livery_core`, tauri-free) and `livery/cli` exist, core logic goes in
`livery/core` instead, and this step also adds a subcommand in `livery/cli` and a variant on its
`Capability` enum. Say so explicitly if you land this before that migration phase, and stop after
step 1.

## 2. Command wrapper

Wrap the function in `#[tauri::command]` plus `#[specta::specta]`, following the shape of
`verify_app_path` in `livery/src-tauri/src/updaters/mod.rs` or `dismiss_themes_greeting` in
`livery/src-tauri/src/themes/commands.rs`: the command reads config from disk, calls the plain
function, and maps the result onto a `#[derive(Debug, Serialize, Type)]` response struct. Keep
serialization types in the same module as the command.

Register the command in `specta_builder()` in `livery/src-tauri/src/lib.rs`, inside
`collect_commands![...]`.

## 3. Regenerate bindings

```bash
cargo test
```

This runs the whole Cargo workspace and, on the way, re-exports
`livery/src/bindings.ts` through the `export_typescript_bindings` test in `lib.rs`. Never hand-edit
`bindings.ts`. The PostToolUse hook and the pre-commit check both verify it matches what `cargo
test` produces, so a stale binding fails before it reaches a commit.

## 4. Frontend

Call the new binding through a TanStack Query hook in `livery/src/queries/`, following
`livery/src/queries/use-themes-status.ts`: a `TOPIC` constant, a `queryKey` helper, `useQuery` for
reads, `useMutation` for writes with a `mutationKey` under the same topic so the MutationCache
invalidates related queries automatically.

Wire the hook into a route under `livery/src/routes/` (routes own state and orchestration) or a
component under `livery/src/components/` (props in, UI out, no fetching of its own) — a settings
page for a specific app goes in `livery/src/components/settings/adapter-pages/`. Read
`livery/src/AGENTS.md` before writing: no filesystem or shell access from TypeScript, every OS
operation goes through the command from step 2.

## 5. Verify

```bash
deno task check
deno task test
cargo clippy
```

All three clean before committing.

## 6. Commit

Commit format and scope rules are in the root `CLAUDE.md`.
