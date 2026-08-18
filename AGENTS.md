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
`cargo fmt`, and `cargo clippy` run from the root. The Tauri bundle is the exception, it needs
`cd livery && deno task build`.

## Sandbox

Never run livery, `tauri dev`, `livery apply`, `livery setup`, or any updater against the real
`$HOME`. An updater writes to real config files.

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

Language conventions come from the `dev-style-*` skills — TypeScript, React, CSS, state, TanStack.
Formatting comes from `deno.json` and `cargo fmt`; never restate either here.

Rust file operations get fixture-based tests, see the `backend-testing` skill.

## Commits

```
<type>(<scope>): <description> black-atom-industries/livery#68
```

The trailing reference is the open migration epic. Once it closes, commits reference their own
issue: `<type>(<scope>): <description> #<issue>`.

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `ci`.

Scope is the package directory name (`core`, `livery`, `nvim`, `ghostty`, and so on). Omit it for
root-level changes and for changes spanning several packages.

Every commit is green: `deno task check` and `deno task test` pass.

## Further context

Scoped instructions: `livery/src/AGENTS.md` (frontend), `livery/src-tauri/AGENTS.md` (backend).
Livery's product and config decisions live in `livery/DESIGN.md` and `livery/ADAPTERS.md`.

## Agent setup

Claude Code reads `.claude/`. Skills there, each a task worth following exactly:

- `new-theme` — add a theme to an existing collection
- `new-adapter` — add a platform adapter
- `rename-theme` — rename a theme across core, adapters, and generated files
- `rename-token` — rename a color token across core and every template
- `add-capability` — add a livery capability end to end
- `release` — cut a release
- `backend-testing` — fixture-based tests for livery's Rust file operations

`.claude/hooks/` runs unprompted: `no-fs-plugin` and `check-bindings` after a write, `install-cli`
at the end of a turn to keep `~/.cargo/bin/livery` in step with the working tree.

Pi reads `.pi/extensions/`, which carries its own livery-install extension.
