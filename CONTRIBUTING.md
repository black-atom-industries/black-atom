# Contributing

## Layout

- `core/` — theme definitions (`core/src/themes/<collection>/`), the generator CLI
  (`core/src/cli/index.ts`), the adapter schema (`core/adapter.schema.json`), and a preview app
  (`core/monitor/`)
- `adapters/<name>/` — one directory per tool, with its templates and generated theme files
- `livery/` — the desktop app that applies a theme across the tools on a machine. GUI binary
  `livery-gui`, terminal client `livery`

[`GLOSSARY.md`](GLOSSARY.md) defines every term the codebase uses.

## Getting started

```bash
git clone https://github.com/black-atom-industries/black-atom.git
cd black-atom
npm install
npm run dev           # GUI, monitor, generation watcher, development CLI
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

Install the standalone [Lefthook](https://lefthook.dev/installation/) binary, then enable hooks explicitly:

```bash
brew install lefthook # macOS; other platforms: see the installation link
npm run install:hooks
```

Pre-commit checks formatting (oxfmt) and lint (ESLint) on staged files, respecting their ignore lists,
plus workspace Rust formatting when Rust files are staged. Checks are read-only;
use `npm run fmt` and `cargo fmt` to format explicitly.

Pre-push runs `npm run verify`, which runs `check` and `test` with their shared steps once,
one after another. Lefthook skips this job when its
push-file detection returns no files. These tasks generate files and build the frontend.
Review generated changes. Hooks check the current checkout, not snapshots of other refs being pushed. Lefthook temporarily hides and restores unstaged portions of partially
staged files during commit checks. This is not a full checkout snapshot: workspace Rust formatting
also sees other unstaged files. CI runs the full check and test tasks independently.

## Releases

[release-please](https://github.com/googleapis/release-please) cuts versions from
[Conventional Commits](https://www.conventionalcommits.org/). The repository carries one version for core, the adapters,
and livery, tagged `v*`. Release notes come from the curated [`CHANGELOG.md`](CHANGELOG.md), and the maintainer process
is in [`docs/releases.md`](docs/releases.md).
