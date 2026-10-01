# Black Atom

A family of dark and light themes for developer tools. Themes are defined once in `core/` and
generated for every platform through adapters. `livery/` is the desktop app that applies a theme
across the tools on a machine.

Every term this codebase uses is defined in [`GLOSSARY.md`](GLOSSARY.md). Name things with those
words in code, commits, and discussion — a concept that already has a name must not acquire a
second one.

## Layout

- `core/` — theme definitions, generator, CLI, adapter schema, preview app (`core/monitor/`)
- `adapters/<name>/` — one directory per platform
- `livery/` — Tauri v2 desktop app; frontend in `livery/src/`, domain logic in `livery/core/`
  (crate `livery_core`, no Tauri dependency), Tauri shell in `livery/src-tauri/`, terminal client
  in `livery/cli/` (binary `livery`)
- `ui/`, `website/` — placeholders

Deno workspace and Cargo workspace both at the root. Tasks live in `deno.json`; `cargo test`,
`cargo fmt`, and `cargo clippy` run from the root. `deno task build` produces the release app and CLI; package-local `livery` build produces the app.

## Sandbox

Agent executions and automated tests must run livery, `tauri dev`, `livery apply`, `livery setup`, and
updaters with a temporary fixture `$HOME` and XDG directories. Updaters write to config files.
User-started development inherits the user's normal environment and existing configuration.

```bash
export HOME="$(mktemp -d)"
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
```

## Themes

Adapters never read primaries. Use UI, syntax, palette, or feedback tokens:
`<%= theme.ui.bg.default %>`, not `<%= theme.primaries.d10 %>`.

An adapter is a `black-atom-adapter.json` plus Eta templates named
`themes/<collection>/collection.template.<ext>`, or a single shared template. The generator renders
one output file per theme next to the template. Generated files are never edited by hand.

## Conventions

Language conventions come from the `nbr-conventions` skill — TypeScript, React, CSS, state, TanStack.
Formatting comes from `deno.json` and `cargo fmt`; never restate either here.

Rust file operations get fixture-based tests, see the `repo-backend-testing` skill.

## Commits

```
<type>(<scope>): <description> black-atom-industries/livery#68
```

The trailing reference is the open migration epic. Once it closes, commits reference their own
issue: `<type>(<scope>): <description> #<issue>`.

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `ci`.

Scope is the package directory name (`core`, `livery`, `nvim`, `ghostty`, and so on). Omit it for
root-level changes and for changes spanning several packages.

Until 0.9.0 is released, new changelog entries go into the `0.9.0` section of `CHANGELOG.md`; no
`## [Unreleased]` section exists before then.

Commit through the `repo-commit` skill. Commits pass read-only formatting and lint checks.
Pre-push runs `deno task verify`, which runs `check` and `test` with their shared steps once and
independent steps in parallel.

## Further context

Scoped instructions: `livery/src/AGENTS.md` (frontend), `livery/src-tauri/AGENTS.md` (backend).
Livery's product and config decisions live in `livery/DESIGN.md` and `livery/ADAPTERS.md`.

## Agent setup

Project skills live in `.agents/skills/`; `.claude/skills` links there. Each is a task worth
following exactly:

- `repo-commit` — commit a change, with its changelog entry and the CI-parity run
- `repo-changelog` — write the changelog entry for a change, or curate a release section
- `repo-release` — cut a release
- `repo-new-theme` — add a theme to an existing collection
- `repo-new-adapter` — add a platform adapter
- `repo-rename-theme` — rename a theme across core, adapters, and generated files
- `repo-rename-token` — rename a color token across core and every template
- `repo-add-capability` — add a livery capability end to end
- `repo-backend-testing` — fixture-based tests for livery's Rust file operations

`.claude/hooks/` runs `no-fs-plugin` and `check-bindings` after a write.

CLI installation is explicit through the root `deno task install:macos` task.
