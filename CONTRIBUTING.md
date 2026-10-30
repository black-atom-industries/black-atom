# Contributing

## Layout

- `core/` — theme definitions (`core/src/themes/<collection>/`), the generator CLI
  (`core/src/cli/index.ts`), and the adapter schema (`core/adapter.schema.json`)
- `adapters/<name>/` — one directory per tool, with its templates and generated theme files
- `livery/` — the desktop app that applies a theme across the tools on a machine. GUI binary
  `livery-gui`, terminal client `livery`
- `website/` — the black-atom.industries site; see [`docs/website.md`](docs/website.md)

[`GLOSSARY.md`](GLOSSARY.md) defines every term the codebase uses.

## Getting started

```bash
git clone https://github.com/black-atom-industries/black-atom.git
cd black-atom
npm install
npm run dev           # GUI, website with the theme lab, generation watcher, development CLI
npm run check         # type check, lint, format, Rust format and Clippy (all targets)
npm run test          # Vitest and Rust workspace tests
npm run build         # release GUI bundle and CLI
npm run install:macos # build and install app + CLI
```

Generation runs automatically before development, checks, tests, and builds. Rust checks and tests
build the required frontend first. `dev` and `livery-dev` use the invoking shell's home, XDG directories,
and existing configuration. Dev links the launcher into an existing user `bin` directory in `PATH`, so a second
terminal can run `livery-dev list`. Existing commands or another worktree's launcher cause a visible
conflict. A launcher left by a dev session that is no longer running is reported at start, and dev
offers to remove it with its session directory. The launcher is ready after successful generation and
compilation; shutdown removes its symlink. The installed `livery` command stays independent.

Debug builds read the adapter themes from the repo's `adapters/` instead of their embedded copy, so
the dev GUI, `livery-dev`, and the end-to-end bridge always apply the current working tree.

On macOS, the root build produces the `.app` bundle and CLI.

`install:macos` installs `/Applications/livery.app` and `$CARGO_HOME/bin/livery` (default
`~/.cargo/bin/livery`). It builds the macOS app bundle without a DMG and performs no setup or apply.

## Git hooks

Vite+ manages the hooks. Point Git at them and apply the repository's Git config once per clone:

```bash
npm run install:hooks # runs `vp config`
npm run git:config    # sets pull.rebase true and merge.ff only
```

Pre-commit (`.vite-hooks/pre-commit`) runs `vp staged` on the staged files: `vp fmt --check` for formatted file types,
`vp lint` for JavaScript and TypeScript, and `cargo fmt --check` when Rust files are staged. The checks are read-only, so
a commit that would change a file is blocked. Unstaged changes are hidden while the checks run. Use `npm run fmt` and
`cargo fmt` to format explicitly.

Pre-push (`.vite-hooks/pre-push`) runs `npm run verify`, then `npm run test:e2e` when the push touches `livery/`,
`core/src/` or `adapters/*/themes/`. It runs the end-to-end suite whenever `origin/main` is unavailable. Hooks check the
current checkout, not snapshots of other refs being pushed. CI runs the full check and test tasks independently.

## Releases

[release-please](https://github.com/googleapis/release-please) cuts versions from
[Conventional Commits](https://www.conventionalcommits.org/). The repository carries one version for core, the adapters,
and livery, tagged `v*`. Release notes come from the curated [`CHANGELOG.md`](CHANGELOG.md), and the maintainer process
is in [`docs/releases.md`](docs/releases.md).
