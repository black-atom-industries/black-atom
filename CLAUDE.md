# Black Atom

A family of dark and light themes for developer tools. Themes are defined once in `core/` and
generated for every platform through adapters. `livery/` is the desktop app that applies a theme
across the tools on a machine.

## Layout

- `core/` — theme definitions, generator, CLI (`core/src/cli/index.ts`), adapter schema
  (`core/adapter.schema.json`), preview app (`core/monitor/`)
- `adapters/<name>/` — one directory per platform (ghostty, herdr, lazygit, niri, nvim, obsidian,
  tmux, waybar, wezterm, zed)
- `livery/` — Tauri v2 desktop app, Deno + Vite + React frontend in `livery/src/`, domain logic in
  `livery/core/` (crate `livery_core`, no Tauri dependency), Tauri shell in `livery/src-tauri/`,
  terminal client in `livery/cli/` (crate `livery-cli`, binary `livery`)
- `ui/`, `website/` — placeholders

Deno workspace at the root (`deno.json`), Cargo workspace at the root (`Cargo.toml`).

## Commands

Run from the repo root.

| Command                   | Does                                          |
| ------------------------- | --------------------------------------------- |
| `deno task dev`           | adapter watcher, livery, and monitor together |
| `deno task dev:adapters`  | adapter watcher only                          |
| `deno task dev:monitor`   | monitor only                                  |
| `deno task dev:livery`    | livery only                                   |
| `deno task generate`      | regenerate every adapter once                 |
| `deno task check`         | `deno check`, `deno lint`, `deno fmt --check` |
| `deno task cli -- <args>` | the `livery` CLI                              |
| `deno task test`          | `deno test -P` and `cargo test`               |
| `deno task install-hooks` | point `core.hooksPath` at `.githooks`         |

`cargo test`, `cargo fmt`, and `cargo clippy` also run from the root. The Tauri bundle needs
`cd livery && deno task build`. The CLI runs as `cargo run -p livery-cli -- <args>` (or
`deno task cli -- <args>`) — never against the real `$HOME`, see Sandbox below.

## Themes

Themes live in `core/src/themes/<collection>/`. Collections: `default`, `jpn`, `terra`, `stations`,
`mnml`, `paper`. Each theme defines primaries, a 16-color palette, feedback colors, and the derived
UI and syntax layers.

Adapters never read primaries. Use UI, syntax, palette, or feedback tokens:
`<%= theme.ui.bg.default %>`, not `<%= theme.primaries.d10 %>`.

Every term in the codebase is defined in `core/UBIQUITOUS_LANGUAGE.md`. Use those words in code,
commits, and discussion.

An adapter is a `black-atom-adapter.json` plus Eta templates named
`themes/<collection>/collection.template.<ext>`, or a single shared template. The generator renders
one output file per theme next to the template. Generated files are never edited by hand.

## Conventions

TypeScript: no `any`, `unknown` only as a last resort. Never more than two positional parameters,
use an object argument beyond that. Derive types from runtime values rather than declaring them
twice. Formatting comes from the root `deno.json`: 4-space indent, 100 columns, semicolons, double
quotes.

Rust: `cargo fmt` and a clean `cargo clippy` before every commit. File operations get fixture-based
tests, see the `backend-testing` skill.

## Sandbox

Never run livery, `tauri dev`, `livery apply`, `livery setup`, or any updater against the real
`$HOME`. An updater writes to real config files. Sandbox first:

```bash
export HOME="$(mktemp -d)"
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
```

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

## Skills

`.claude/skills/`:

- `new-theme` — add a theme to an existing collection
- `new-adapter` — add a platform adapter
- `rename-theme` — rename a theme across core, adapters, and generated files
- `rename-token` — rename a color token across core and every template
- `add-capability` — add a livery capability end to end
- `release` — cut a release
- `backend-testing` — fixture-based tests for livery's Rust file operations

`.claude/hooks/` runs on every agent session: `no-fs-plugin` and `check-bindings` after a write,
`install-cli` at the end of a turn to keep `~/.cargo/bin/livery` in step with the working tree.

Scoped context: `livery/src/AGENTS.md` (frontend), `livery/src-tauri/AGENTS.md` (backend).
Livery's product and config decisions live in `livery/DESIGN.md`, `livery/ADAPTERS.md`, and
`livery/GLOSSARY.md`.
