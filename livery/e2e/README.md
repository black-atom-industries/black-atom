# Livery end-to-end tests

Playwright Test drives the Livery UI in Chromium. The UI runs on its own Vite server, and every
command goes over the dev bridge to `livery-bridge`, a headless debug binary that serves the real
Tauri commands. Tests assert on rendered UI state and on the files livery writes.

## Run

From the repository root:

```bash
deno task test:e2e        # headless
deno task test:e2e:ui     # Playwright UI mode: watch each step, inspect snapshots
```

Inside `livery/e2e`, the same tasks are `deno task test`, `deno task test:ui` and
`deno task report` (last HTML report). Arguments pass through, for example
`deno task test tests/settings` or `deno task test --update-snapshots`. Both test tasks build
`livery-bridge` first. Stop UI mode with Ctrl+C so Playwright shuts down both servers.

Chromium comes from the Playwright browser cache. On a machine without it, run
`deno run -A npm:@playwright/test@1.62.1 install chromium` once.

## Isolation

Each run creates a temp directory `livery-e2e-*` as the fixture home and starts `livery-bridge`
with `HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME` and `TMPDIR` inside it. Before
every test, the fixture resets that home to a copy of the scenario in `fixtures/`, after checking
that the bridge resolves `$HOME` to it. The reset refuses any path outside the system temp dir. The
home stays on disk after the run for inspection.

Set `LIVERY_E2E_HOME` to reuse one fixture home across runs, for example to inspect it after a
UI-mode session. It must still be a `livery-e2e-*` directory directly under the system temp dir.

Vite listens on `1520` and the bridge on `1522`, configurable through `LIVERY_E2E_VITE_PORT` and
`LIVERY_E2E_BRIDGE_PORT`, so a running `deno task dev` on `1420`/`1422` is never touched. The e2e
Vite server keeps its dependency cache in `e2e/.vite`.

Scenarios enable only adapters whose updaters stay inside the fixture home: zed, delta, lazygit,
and tuicr for setup. `system_appearance` is `false`. Ghostty (signals running instances), tmux,
nvim, herdr (talk to running apps) and Obsidian stay disabled and are never applied. The nvim
settings page only writes its managed block into the fixture `init.lua`.

## Layout

- `fixtures/<scenario>/` — a `$HOME` snapshot: `existing-installation` (configured adapters and an
  active theme), `fresh` (empty home)
- `lib/` — environment, fixture home reset, bridge calls, and `e2e.ts` with the extended `test`
  and locators
- `tests/<topic>/` — one folder per topic, small independent specs; `toHaveScreenshot()` baselines
  sit next to each spec

Screenshot baselines are macOS Chromium renders. They change with theme colors and the app
version shown in the header; regenerate them with `--update-snapshots` and review the diff.

## Coverage gaps

- Chromium is not the macOS WKWebView. Rendering and input differences in the shipped app are
  not covered.
- The native window, global shortcut, `q` to quit, the file dialog (USE FINDER) and opening URLs
  are not covered.
- Updaters that signal running apps (ghostty, tmux, nvim, herdr), Obsidian, and the system
  appearance switch are not exercised.
- Linked/unlinked status is read from `get_app_status` on the bridge; the UI does not render it.
