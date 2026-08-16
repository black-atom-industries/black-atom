---
name: add-capability
description: Add a livery capability end to end, from core Rust logic through the Tauri command to the frontend query hook. Load when adding a new user-facing action to the livery app, not a new per-app updater (see the updaters guide in `livery/src-tauri/AGENTS.md` for that).
---

# Add Capability

A capability is one user-facing action: a Tauri command backed by a plain Rust function, called
from the frontend through a generated binding. Build it inside-out, core logic first.

## 1. Core logic

Write the logic as a plain function in `livery/core` (crate `livery_core`, tauri-free): no
`#[tauri::command]`, no `#[specta::specta]`, no Tauri types in the signature. It lives next to the
feature it belongs to: `livery/core/src/config/`, `livery/core/src/themes/`, or a new module under
`livery/core/src/updaters/`. Read `livery/core/src/updaters/mod.rs` first to see where similar
logic already sits.

If the function touches files, read the `backend-testing` skill and follow its fixture pattern:
real config fixtures under `livery/core/tests/fixtures/`, not inline test strings, plus an
idempotency test. Add `#[cfg(test)] mod tests` in the source file for anything else.

Once `livery/cli` exists, this step also adds a subcommand there plus a variant on its `Capability`
enum. Say so explicitly if you land this before that migration phase, and stop after step 1.

## 2. Command wrapper

Add a wrapper in `livery/src-tauri/src/commands.rs` carrying `#[tauri::command]` plus
`#[specta::specta]`, following the shape of `verify_app_path` there: same name, same signature, one
call into the `livery_core` function. The doc comment lives on the wrapper — specta lifts it into
`bindings.ts` as the binding's JSDoc.

The response type is a `#[derive(Debug, Serialize, Type)]` struct that stays `pub` in the
`livery_core` module owning the function, and the wrapper re-exports nothing.

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
