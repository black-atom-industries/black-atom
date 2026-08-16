# livery

> Paint your cockpit.

A desktop app for managing [Black Atom](https://github.com/black-atom-industries) themes across your
developer tools. Pick a theme once, apply it everywhere.

## Supported Apps

| App                   | What it does                                | Reload                    |
| --------------------- | ------------------------------------------- | ------------------------- |
| **Ghostty**           | Updates `theme = ...` in config             | SIGUSR2 (instant repaint) |
| **Neovim**            | Updates `colorscheme = "..."` in Lua config | Live via server sockets   |
| **Tmux**              | Updates `source-file` theme path            | `tmux source-file`        |
| **Delta**             | Switches `features = black-atom-dark/light` | On next git command       |
| **Zed**               | Patches `theme` in settings.json (JSONC)    | Auto-watches file changes |
| **Lazygit**           | Merges theme YAML into config               | On next lazygit launch    |
| **Herdr**             | Replaces a managed TOML theme block         | Socket config reload      |
| **Obsidian**          | Patches appearance + style settings JSON    | `obsidian reload`         |
| **System Appearance** | Toggles macOS dark/light mode               | Immediate                 |

## Architecture

- **Frontend**: React + TanStack (Router, Store, Query) in a Tauri v2 webview
- **Backend**: Rust handles all file I/O and OS operations via typed commands
- **Config**: `~/.config/black-atom/livery/config.json` — per-app settings with configurable
  match/replace patterns

## Status

Active development. See the
[livery project](https://linear.app/black-atom-industries/project/livery-ebebb9cdaef9) for progress.

## Development

Run the desktop app with:

```sh
deno task dev
```

For browser-based visual editing with Airship:

```sh
deno task airship
```

This starts the Tauri app, Vite, and Airship together. Debug builds expose the Rust command bridge
on loopback so Airship frames can use the real configuration and settings.

## Tech Stack

| Layer      | Technology                                      | Notes                                     |
| ---------- | ----------------------------------------------- | ----------------------------------------- |
| Runtime    | [Deno](https://deno.com/)                       | Dev server, formatting, linting, testing  |
| App shell  | [Tauri v2](https://tauri.app/)                  | Rust + system webview                     |
| Frontend   | [React](https://react.dev/) 18                  | Automatic JSX transform                   |
| State      | [TanStack](https://tanstack.com/) Store + Query | Client + server state                     |
| Build      | [Vite](https://vite.dev/) 6                     | Via `deno run -A npm:vite`                |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4     | Vite plugin                               |
| Theme data | `@black-atom/core`                              | JSR package                               |
| Config     | JSON                                            | `~/.config/black-atom/livery/config.json` |

## Logs

Livery writes logs to the platform log directory:

| Platform | Path                                                          |
| -------- | ------------------------------------------------------------- |
| macOS    | `~/Library/Logs/industries.black-atom.livery/livery.log`      |
| Linux    | `~/.local/share/industries.black-atom.livery/logs/livery.log` |

Logs rotate automatically at 5 MB. Previous log files are kept alongside the current one.

## Origin of Name

[Livery](https://en.wikipedia.org/wiki/Livery_(aircraft)) is the paint scheme of an aircraft — its
visual identity.

## Other Black Atom Utils

- [helm](https://github.com/black-atom-industries/helm) — tmux session and repo management
- [radar.nvim](https://github.com/black-atom-industries/radar.nvim) — file nav

## License

MIT
