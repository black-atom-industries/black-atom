# How to test

Hand-off for the human tester: everything below is what a person has to verify with the real
apps. Agent checks are what was already proven in a throwaway `HOME`; they do not tick the box.

## Test context

- Build: `main` at the commit that carries this file (`git log -1`), repo
  `nikbrunner/black-atom`.
- Launch: `deno task dev` for the whole dev set, `cd livery && deno task build` for the bundle
  (`target/release/bundle/macos/livery.app`, binary `livery-gui`), `cargo build -p livery-cli` for
  the CLI (`target/debug/livery`).
- Machine: your Mac with the real Ghostty, tmux, Neovim, Zed, Obsidian, lazygit, herdr, delta,
  helm-tmux configs. Linux checks (niri, waybar) are manual file installs, no updater exists.
- Change summary: one repo; adapters generate from the in-tree core; nvim colorschemes are
  self-contained; livery embeds all themes and unpacks them to `~/.local/share/black-atom/themes`,
  keeps its config in `~/.config/black-atom/livery/config.json`, has a CLI, and writes Neovim
  settings into a managed block in `init.lua`.

## Back up first

Livery writes into files your dots repo tracks. Copy these before step one, or commit dots so a
`git diff` shows every change:

- `~/.config/black-atom/livery/config.json` (livery config; migrated in place if
  `XDG_CONFIG_HOME` is unset, which is the macOS default)
- `~/.config/black-atom/themes/` (old managed dir; livery no longer reads it, safe to delete after)
- `~/.config/ghostty/config` and `~/.config/ghostty/themes/`
- `~/.config/tmux/tmux.conf` and `~/.config/tmux/themes/`
- `~/.config/nvim/lua/config.lua` (colorscheme line) and `~/.config/nvim/init.lua` (managed block)
- `~/.config/zed/settings.json` and `~/.config/zed/themes/`
- your Obsidian vault's `.obsidian/themes/` and `appearance.json`
- `~/.config/lazygit/config.yml`, `~/.config/herdr/config.toml`, `~/.gitconfig.delta`,
  `~/.config/black-atom/helm-tmux/config.yml`
- new dirs livery creates: `~/.local/share/black-atom/themes/`,
  `~/.local/share/nvim/site/pack/black-atom/start/black-atom` (symlink)

## Entry criteria

- [ ] `deno task check`, `deno task test`, `cargo test --workspace` pass from the repo root.
  - Agent check: PASS — run before every commit by the pre-commit hook; 115 Rust + 103 TS tests
    at f93e181.
- [ ] `cd livery && deno task build` produces `livery.app` with `Contents/MacOS/livery-gui`.
  - Agent check: PASS — built at 17:28 with a sandbox HOME.
- [ ] `cargo build -p livery-cli` produces `target/debug/livery`; `livery --help` lists `apply`,
      `list`, `status`, `setup`, `appearance`, `nvim-settings`.
  - Agent check: PASS — sandbox run.

## Critical user journeys

### 1. Clone and dev

- [ ] Fresh clone, `deno install`, `deno task dev`: the adapter watcher, livery (Vite 1420 + Tauri
      window) and the monitor (Vite 4170, API 4171) come up together; Ctrl-C stops all three.
  - Agent check: PASS — each `dev:*` task started under a timeout; the combined `dev` started
    all three; process cleanup verified.
- [ ] Edit one primaries value in `core/src/themes/jpn/black-atom-jpn-koyo-yoru.ts`, save: the
      watcher regenerates, `git status` shows changed adapter files; revert, tree clean.
  - Agent check: PASS — one edit changed 8 generated files across adapters and reverted clean
    with `deno task generate`.

### 2. First run of livery (config migration and unpack)

- [ ] With your existing `~/.config/black-atom/livery/config.json` in place, start `livery-gui`
      (or run `livery status`): the config is read from `~/.config/black-atom/livery/config.json`
      (unchanged path on macOS) and every enabled app you had is still enabled.
  - Agent check: PASS (sandbox) — migration copies a legacy file when the XDG path differs and
    is a no-op when equal; NOT RUN against your real config.
- [ ] `ls ~/.local/share/black-atom/themes` shows ten adapter dirs plus `.stamp`; obsidian has
      `theme.css` and `manifest.json`; nvim has `colors/` and `lua/`; no `collection.template.*`
      anywhere under it.
  - Agent check: PASS — sandbox unpack: 10 adapters, 419 files, 0 templates.
- [ ] Rebuild livery after changing any theme in core and regenerating: the next start re-unpacks
      (`.stamp` changes) and the changed value shows in
      `~/.local/share/black-atom/themes/ghostty/...`.
  - Agent check: NOT RUN end to end; stamp logic covered by the smoke suite.

### 3. CLI apply

- [ ] `livery list` prints all 38 themes grouped by collection.
  - Agent check: PASS — sandbox.
- [ ] `livery setup` (interactive) or `livery setup --yes`: detects your installed apps, enables
      them, links themes for Linked apps, verifies config paths; `livery status` shows
      `enabled … linked=true config=ok` for ghostty, tmux, zed, obsidian, nvim.
  - Agent check: PASS — sandbox `setup --yes` enabled and verified ghostty, tmux, nvim, zed,
    delta, lazygit, herdr and obsidian (all seeded from fixtures); status showed linked=true
    for the five Linked apps.
- [ ] `livery apply black-atom-jpn-koyo-yoru`: every enabled app reports `done`; Ghostty and tmux
      pick the theme up live (tmux reloads, Ghostty on config reload); Zed and Obsidian switch
      when their settings/theme file changes.
  - Agent check: PASS — sandbox apply patched all eight seeded apps (nvim, tmux, ghostty, zed,
    delta, lazygit, herdr, obsidian); a second theme changed six files, a repeat apply changed
    nothing. Live reload of real apps NOT RUN. Caution: the nvim updater reloads every Neovim
    socket on the machine, sandbox or not.
- [ ] Bare `livery`: a fuzzy picker opens; pick a theme, it applies.
  - Agent check: NOT RUN (interactive).
- [ ] `livery apply not-a-theme` exits 1 with a clear message; `livery status | head -1` prints one
      line, no panic.
  - Agent check: PASS — both in sandbox.

### 4. GUI

- [ ] Open `livery.app`: the app starts, the theme list shows 38 themes, no greeting or download
      prompt appears.
  - Agent check: PASS — the GUI was driven in Chrome through livery's dev bridge: 38 themes,
    six collections, no greeting; the real Tauri window NOT RUN.
- [ ] Apply a theme from the GUI: same effect on the apps as the CLI.
  - Agent check: PASS — apply from the GUI reported 6/6 OK in 73 ms and the six sandbox
    files carried the theme.
- [ ] Settings → an adapter page (Ghostty): "set up", "verify path" work; the page shows the
      class (Linked) and no download rows.
  - Agent check: NOT RUN.

### 5. Neovim

- [ ] Without livery: with `adapters/nvim` on the runtimepath and no plugin manager entry,
      `:colorscheme black-atom-jpn-koyo-yoru` loads; `:hi Normal` shows a background;
      `:colorscheme black-atom-default-light` switches `background` to light.
  - Agent check: PASS — headless with `-u NONE`: bg `#261a2a`; light theme sets
    `background=light`; all 38 load without error.
- [ ] Set `vim.g.black_atom_core_config = { styles = { transparency = "full" } }` before the
      colorscheme: `Normal` has no background. Set
      `styles.syntax.comments = { bold = true, italic = false }`: comments are bold, not italic.
  - Agent check: PASS — headless: empty bg; `Comment` bold=1.
- [ ] After `livery setup` with nvim enabled: `~/.local/share/nvim/site/pack/black-atom/start/black-atom`
      is a symlink into `~/.local/share/black-atom/themes/nvim`; a fresh Neovim finds the
      colorschemes without any plugin entry (`:colorscheme black-atom-` completes).
  - Agent check: PASS (sandbox link created and resolved by the smoke suite); real Neovim NOT RUN.
- [ ] `livery apply <theme>` with Neovim running: open instances switch (socket reload), and the
      colorscheme line in `~/.config/nvim/lua/config.lua` is patched.
  - Agent check: NOT RUN (needs live sockets).
- [ ] GUI → Settings → Neovim: toggle `transparency` to `full` and one syntax style, save: a
      `-- BEGIN BLACK ATOM LIVERY CONFIG … -- END BLACK ATOM LIVERY CONFIG` block appears in
      `~/.config/nvim/init.lua` (or the path shown on the page) with those values; a restarted
      Neovim reflects them; saving again replaces the block, nothing else in `init.lua` moves.
  - Agent check: PASS — done from the GUI in Chrome: transparency FULL and comments bold
    saved, the block appeared once in the sandbox `init.lua`, headless Neovim sourcing it
    showed no `Normal` background and bold comments; a second save replaced the block.

### 6. Obsidian

- [ ] With obsidian enabled and the vault path set, `livery apply`: `.obsidian/themes/Black Atom/`
      (or the name shown on the page) holds `theme.css` and `manifest.json` from
      `~/.local/share/black-atom/themes/obsidian`, and Obsidian shows the theme in Appearance.
  - Agent check: PASS in a sandbox vault: `.obsidian/themes/Black Atom/` was linked and
    `appearance.json` patched; a real vault NOT RUN.

### 7. Merged apps

- [ ] lazygit and herdr: `livery apply` writes the theme into their configs (lazygit yaml, herdr
      managed TOML block); both apps show the colours on next start.
  - Agent check: PASS for the file writes in the sandbox (lazygit yaml, herdr managed block);
    the apps themselves NOT RUN.

## Important edge cases

- [ ] Run `livery apply` twice in a row: second run is a no-op on every file (no growing blocks,
      no duplicate lines).
  - Agent check: PASS — a repeated `livery apply` left every seeded config byte-identical.
- [ ] Point an app's config path at a file that does not exist: `livery status` says
      `config=missing`, `apply` reports an error for that app, exit 1, other apps still apply.
  - Agent check: PASS (sandbox: unset apps show `missing`; failing app exits 1).
- [ ] Delete `~/.local/share/black-atom/themes` while an app is linked, run `livery apply`: the
      dir is re-unpacked and links resolve again.
  - Agent check: PASS — deleted the sandbox themes dir; the next apply re-unpacked ten adapters
    and the tmux symlink resolved again.
- [ ] Set `XDG_CONFIG_HOME` / `XDG_DATA_HOME` to another dir before starting livery: config and
      themes go there; the old `~/.config` file is copied over once, not moved.
  - Agent check: PASS — smoke suite runs entirely under XDG overrides.

## UX and accessibility pass

- [ ] Every CLI error message names the file or app involved and what to do.
  - Agent check: PASS for the paths exercised (`Pattern not found in <path>`, `not-a-theme`).
- [ ] The Neovim settings page: labels on every toggle, the syntax grid readable, save disabled
      until something changed, an error banner when the write fails.
  - Agent check: NOT RUN.

## Regression smoke

- [ ] Ghostty, tmux, Zed apply exactly as before the move (same files patched, same live reload).
  - Agent check: PASS for file patching (fixture tests + sandbox); live reload NOT RUN.
- [ ] Global shortcut to toggle the livery window still works.
  - Agent check: NOT RUN.
- [ ] `deno task dev:monitor` shows all six collections including `paper`.
  - Agent check: PASS (monitor starts); content NOT RUN.

## Exploratory prompts

- Switch themes rapidly ten times from the picker; watch for stale symlinks or a stuck tmux.
- Set a nonsense value in the managed nvim block by hand, then save from the GUI; expect the
  block replaced, not appended.
- Move your vault; re-run setup for obsidian.

## Defect log

| Severity | Steps | Expected | Actual | Environment | Evidence |
| -------- | ----- | -------- | ------ | ----------- | -------- |
|          |       |          |        |             |          |

## Sign-off

- Decision: pass / fail
- Known issues: see GitHub issues #2–#7 in `nikbrunner/black-atom`
- Retest:
- Tester / date:
