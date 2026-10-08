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

## Sandbox

Agent executions and automated tests must run livery, `tauri dev`, `livery apply`, `livery setup`, and
updaters with a temporary fixture `$HOME` and XDG directories. Updaters write to config files.
User-started development inherits the user's normal environment and existing configuration.

Trust the real mise config before swapping `$HOME`. Under a fixture home, mise reads it as an
untrusted project config and every shimmed tool fails.

```bash
export MISE_TRUSTED_CONFIG_PATHS="$HOME/.config/mise"
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

## Further context

Scoped instructions: `livery/src/AGENTS.md` (frontend), `livery/src-tauri/AGENTS.md` (backend).
Livery's product and config decisions live in `livery/DESIGN.md` and `livery/ADAPTERS.md`.

## Agent setup

Project skills live in `.agents/skills/`, each a task worth following exactly; `.claude/skills`
links there. `.claude/hooks/` runs `no-fs-plugin` and `check-bindings` after a write.
