# livery

> Paint your cockpit.

A desktop app and CLI for applying [Black Atom](../core/) themes across your developer tools. Pick
a theme once, apply it everywhere.

## How it works

Livery embeds every adapter's generated theme files in its binary and unpacks them into
`$XDG_DATA_HOME/black-atom/themes/<adapter>/` (`~/.local/share` if `XDG_DATA_HOME` is unset).
Livery's own settings live in `$XDG_CONFIG_HOME/black-atom/livery/config.json`.

Each supported app falls into one provisioning class: Linked, Merged, or External. See
[ADAPTERS.md](ADAPTERS.md) for the class definitions and per-app contracts.

## CLI

```sh
livery                       # interactive theme picker
livery apply <theme>         # apply a theme to every enabled app
livery list                  # list every available theme, grouped by collection
livery status                # show each app's enabled, provisioning, linked and config state
livery setup [--yes]         # enable detected apps, link their themes, verify config paths
livery appearance <dark|light>  # switch the system between dark and light mode
livery nvim-settings         # write stored Neovim plugin settings into nvim's managed Lua block
```

## GUI

`livery-gui` is the Tauri desktop app. Same picker, status, and setup flows as the CLI, in a
window.

## Development

```sh
deno task dev:livery   # from the repo root: frontend + Tauri shell together
cargo test              # from the repo root: livery_core and livery-cli tests
```

Bundle the desktop app:

```sh
cd livery && deno task build
```

Never run `livery apply`, `livery setup`, or `deno task dev:livery` against your real `$HOME`. See
the Sandbox section in the root `CLAUDE.md`.

## Architecture

- **Frontend**: React + TanStack (Router, Store, Query) in a Tauri v2 webview, `livery/src/`
- **Domain logic**: `livery/core/` (crate `livery_core`), no Tauri dependency
- **Tauri shell**: `livery/src-tauri/` (binary `livery-gui`)
- **CLI**: `livery/cli/` (crate `livery-cli`, binary `livery`)

## Logs

Livery writes logs to the platform log directory:

| Platform | Path                                                          |
| -------- | ------------------------------------------------------------- |
| macOS    | `~/Library/Logs/industries.black-atom.livery/livery.log`      |
| Linux    | `~/.local/share/industries.black-atom.livery/logs/livery.log` |

Logs rotate automatically at 5 MB. Previous log files are kept alongside the current one.

## Origin of name

[Livery](https://en.wikipedia.org/wiki/Livery_(aircraft)) is the paint scheme of an aircraft, its
visual identity.

## License

MIT
