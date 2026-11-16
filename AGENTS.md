# Black Atom

A family of dark and light themes for developer tools. Themes are defined once in `core/` and
generated for every platform through adapters. `livery/` is the desktop app that applies a theme
across the tools on a machine.

Every term this codebase uses is defined in [`docs/glossary.md`](docs/glossary.md). Name things with those
words in code, commits, and discussion — a concept that already has a name must not acquire a
second one.

## Where facts live

| Topic                                                                   | Read                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Color groups, derivation order, palette slots and ANSI map, feedback    | [`docs/colors.md`](docs/colors.md)                                      |
| Designing a theme, contrast                                             | [`docs/theme-design.md`](docs/theme-design.md)                          |
| Generation pipeline, adapter config, templates, tokens a template reads | [`docs/adapter-guide.md`](docs/adapter-guide.md)                        |
| Terms and the words to use for them                                     | [`docs/glossary.md`](docs/glossary.md)                                  |
| Repo layout, dev commands, Git hooks, releases                          | [`CONTRIBUTING.md`](CONTRIBUTING.md)                                    |
| The collections and themes                                              | `core/src/themes/catalog.ts`                                            |
| The adapters                                                            | `adapters/*/black-atom-adapter.json`, one directory each                |
| Per-tool wiring, and Livery's side of it                                | `adapters/<name>/README.md`, [`livery/ADAPTERS.md`](livery/ADAPTERS.md) |
| Website routes, theme precedence, live data, sound                      | [`docs/website.md`](docs/website.md)                                    |
| Release process                                                         | [`docs/releases.md`](docs/releases.md)                                  |
| Step-by-step procedures (new theme, collection, adapter, rename)        | The `repo-*` skills in `.agents/skills/`                                |

## Layout

The directories and what each holds are in [`CONTRIBUTING.md`](CONTRIBUTING.md#layout).

## Sandbox

`npm run dev` runs in the user's normal environment, whoever starts it: it reapplies every theme
change to the real configs, so the user sees it live in their tools. Automated tests, and agent runs
of livery, `tauri dev`, `livery apply`, `livery setup`, and updaters outside `npm run dev`, use a
temporary fixture `$HOME` and XDG directories, because updaters write to config files.

Trust the real mise config and point Playwright at the real browser cache before swapping `$HOME`.
Under a fixture home, mise reads its config as an untrusted project config and every shimmed tool
fails, and Playwright finds no browsers.

```bash
export MISE_TRUSTED_CONFIG_PATHS="$HOME/.config/mise"
export PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright"
export HOME="$(realpath "$(mktemp -d)")"
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
```

## Themes

Templates read UI, syntax and palette tokens. A target that defines its own color ramp may also
read primaries, as [`docs/adapter-guide.md`](docs/adapter-guide.md) describes. Generated files are never
edited by hand.

## Conventions

Language conventions come from the `nbr-repo-conventions` skill — TypeScript, React, CSS, state, TanStack.
Formatting comes from the `fmt` block of `vite.config.ts` and `cargo fmt`; never restate either here.

## Further context

Scoped instructions: `livery/src/AGENTS.md` (frontend), `livery/src-tauri/AGENTS.md` (backend).
Livery's product and config decisions live in `livery/DESIGN.md` and `livery/ADAPTERS.md`.

## Agent setup

Project skills live in `.agents/skills/`, each a task worth following exactly; `.claude/skills`
links there. `.claude/settings.json` runs `format.sh`, `no-fs-plugin.sh` and `check-bindings.sh`
from `.claude/hooks/` after each write or edit.
