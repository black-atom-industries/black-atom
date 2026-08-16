# Migration state

Phase: 4
Last completed task: 4.1 livery_core split out of the tauri crate; repo created and pushed (github.com/black-atom-industries/black-atom), first CI run watching (Phase 3 gate green before it: nine adapters emit themes/<collection>/, nvim emits colors/, headless checks pass)
Next: 4.2 binary names (livery-gui) and 4.3 embed themes + XDG paths
Blocked on Nik: (none)
Decisions made in-run:

- 2026-08-16 core's org-dir resolution and per-adapter git calls were re-pointed/removed in Phase 1 (task 1.4) so no dev task can write into the old checkouts.
- 2026-08-16 baseline counts: 100 Rust tests (brief says 101); TS 70 livery + 51 core/monitor at copy time, 109 after core's `org_test.ts` went with the `org` task.
- 2026-08-16 15:15 livery moves to React 19: monitor is on 19 and shares `@base-ui/react` and TanStack versions with livery, so one workspace dedups them onto React 19 types and livery's check breaks on 18. Nik confirmed at 15:17: dependencies may be updated and React 19 features used where a touched line benefits.
- 2026-08-16 15:30 in-tree generation invocation: `deno run -A <core>/src/cli/index.ts generate` with cwd = adapter dir (plain form; `--config` pointing at a member is not needed inside the workspace).
- 2026-08-16 15:40 Phase 1 reviews (sonnet + Codex) flag stale multi-repo docs in `core/README.md`, `core/docs/adapter-generation-architecture.md`, `core/docs/adapter_development-guide.md`, `core/src/cli/index.ts` help text and every adapter README. Core docs and CLI help are Phase 2 work; READMEs are Phase 5.
- 2026-08-16 15:40 `livery/src-tauri/tauri.conf.json` carries version 0.1.0 while deno.json/Cargo.toml say 0.2.0; Phase 5 adds it to release-please extra-files.

- 2026-08-16 15:55 core adapter config gains an optional per-collection `output` directory (default: the template's directory) so shared templates can emit `themes/<collection>/` and nvim can emit `colors/`; herdr's postGenerate mover goes.
- 2026-08-16 15:55 nvim colorschemes carry the full theme table and call a small runtime under `lua/black-atom/` on the same rtp entry (highlight logic in one place). Consequence for Phase 4: nvim's embed covers `colors/` and `lua/`, and the Linked placement is a pack dir on the runtimepath. The registry reclassification to Linked lands in Phase 4 together with the embedding, where the files exist.
- 2026-08-16 16:10 XDG paths: `dirs::config_dir()`/`data_dir()` resolve to `~/Library/Application Support` on macOS, so livery uses `$XDG_CONFIG_HOME` / `$XDG_DATA_HOME` with `~/.config` / `~/.local/share` fallbacks on every platform (`livery_core::paths`).
- 2026-08-16 16:10 Embedded set is ten adapters (nine `themes/` dirs, nvim `colors/` + `lua/`, obsidian's root `theme.css` + `manifest.json`); unpack writes `black-atom-*` files, obsidian's two root files and nvim's `lua/` tree, nothing else.
- 2026-08-16 16:27 Nik: unpack is keyed on a hash of the embedded payload rather than the crate version, so debug builds pick up adapter edits.
- 2026-08-16 16:10 `get_themes_status` is replaced by `get_app_status` (per-app provisioning + linked flag) because the adapter pages still need that state; the download surface itself is deleted as the issue lists.
- 2026-08-16 16:10 Neovim settings are stored in livery config as `apps.nvim.settings` and written into a managed Lua block in `apps.nvim.settings_path` (default `~/.config/nvim/init.lua`); the colorscheme-line patch stays.

Follow-up issues filed: (none)
