# Herdr Adapter + Livery Integration Plan

## Context

Create an end-to-end Black Atom integration for Herdr. Herdr has no theme-file loader or config include mechanism; its only user-defined theme surface is an inline `[theme.custom]` table in `~/.config/herdr/config.toml`. Livery must therefore download generated Herdr fragments, splice the selected fragment into the config, and request a live reload.

Confirmed constraints from `HANDOFF-2026-07-21-herdr-adapter.md` and the local Herdr source:

- Herdr exposes exactly 16 custom colors: `accent`, `panel_bg`, `surface0`, `surface1`, `surface_dim`, `overlay0`, `overlay1`, `text`, `subtext0`, `mauve`, `green`, `yellow`, `red`, `blue`, `teal`, and `peach`.
- Custom overrides are global, so Herdr's own dark/light auto-switch cannot represent two Black Atom variants. Livery must switch the complete block.
- `herdr server reload-config` calls the socket API and returns a JSON `config_reload` result; there is no file watcher.
- Livery's existing **Merged** provisioning class is the correct model: it already downloads collection-based adapter output and lets an app-specific updater consume it on every switch.
- No `black-atom-industries/herdr` GitHub repository currently exists, while Livery downloads adapters from `https://codeload.github.com/black-atom-industries/<repo>/tar.gz/HEAD`.
- The core and Livery worktrees already contain unrelated user changes. Implementation must not reset, overwrite, or fold those changes into this work; in particular, the Livery settings/router files are mid-refactor.

## Approach

### Adapter output

Create `../herdr` from the current adapter conventions, with all six current collections (`default`, `jpn`, `stations`, `terra`, `mnml`, `paper`). Generate one `.toml` fragment per theme. Each fragment is a complete, manually usable managed block:

```toml
# BEGIN BLACK ATOM LIVERY THEME
# <theme label>
[theme]
name = "catppuccin" # or catppuccin-latte for light themes

[theme.custom]
# all 16 resolved colors
# END BLACK ATOM LIVERY THEME
```

Use only semantic Black Atom inputs:

| Herdr | Black Atom source |
| --- | --- |
| `accent` | `theme.ui.fg.accent` |
| `panel_bg` | `theme.ui.bg.panel` |
| `surface0` | `theme.ui.bg.active` |
| `surface1`, `surface_dim` | one derived surface: 90% `theme.ui.bg.active` + 10% `theme.ui.fg.disabled` via a template-local sRGB hex blend, keeping it distinct from `surface0` without accessing primaries |
| `overlay0` | `theme.ui.bg.disabled` |
| `overlay1` | `theme.ui.fg.disabled` |
| `text` | `theme.ui.fg.default` |
| `subtext0` | `theme.ui.fg.subtle` |
| `red`, `green`, `yellow`, `blue` | matching `theme.palette.*` colors |
| `teal` | `theme.palette.cyan` |
| `mauve` | `theme.palette.magenta` |
| `peach` | `theme.palette.darkYellow` |

The derived surface preserves the validated Herdr contrast relationship (`surface0` → derived separator/track → `overlay0`) while obeying the adapter rule against direct `theme.primaries`/`theme.accents` access. Keep collection templates identical except for their location, following existing adapter repos.

### Safe config update

Add a dedicated Herdr updater in Livery rather than stretching the generic one-line regex patcher:

1. Read the selected downloaded fragment from `{themesPath}/{collectionKey}/{themeKey}.toml`.
2. Require the source fragment to contain exactly one correctly ordered marker pair and validate it as TOML.
3. In the target config:
   - replace exactly one valid managed block when present;
   - if no markers and no live `[theme]`/`[theme.custom]` table exists, append the block with normalized surrounding newlines;
   - refuse to write when markers are missing/duplicated/misordered or when an unmanaged theme table would make append unsafe.
4. Validate the complete candidate config as TOML before an atomic write under `$HOME`.
5. Run `herdr server reload-config`; parse the JSON response and report `Done` only for `applied`. Preserve the successful file update but return Livery's degraded/`Skipped` result when Herdr is absent, not running, returns non-zero, or reports `partial`/`failed`, matching existing Ghostty/Tmux reload semantics.

This keeps every byte outside the marked block unchanged and makes repeated application idempotent.

### Livery and dotfiles wiring

Register Herdr as a downloadable **Merged** adapter with default paths:

- `config_path`: `~/.config/herdr/config.toml`
- `themes_path`: `~/.config/black-atom/themes/herdr`
- editable settings: config path + themes path

Add the standard Herdr settings page by reusing the existing merged-adapter UI composition; no new visual pattern is needed. Regenerate Tauri/Specta TypeScript bindings and update dev fixtures/docs.

In dots:

- wrap the current active `[theme] name = "terminal"` stanza with the exact markers, preserving current behavior until Livery first applies a Black Atom theme;
- add an enabled Herdr entry to `common/.config/black-atom/livery/config.json` with the paths above;
- leave unrelated Herdr settings and commented theme experiments untouched.

Do not add Herdr to `theme-link.sh`: Herdr cannot consume symlinked theme files, and Livery's Merged flow owns this integration.

## Files to modify

### New adapter repository (`../herdr`)

- `black-atom-adapter.json`
- `deno.json`
- `LICENSE`
- `README.md`
- `CLAUDE.md`
- `themes/{default,jpn,stations,terra,mnml,paper}/collection.template.toml`
- Generated `themes/<collection>/black-atom-*.toml` files

### Livery (`../livery`)

- `src-tauri/src/config/types.rs`
- `src-tauri/src/config/defaults.rs`
- `src-tauri/src/themes/registry.rs`
- `src-tauri/src/themes/detect.rs` tests as needed for the new enum member
- `src-tauri/src/themes/extract.rs`/tests only if the existing collection layout needs additional coverage
- `src-tauri/src/updaters/mod.rs`
- `src-tauri/src/updaters/herdr.rs` (new)
- `src-tauri/src/updaters/file_ops/mod.rs`
- `src-tauri/src/updaters/file_ops/managed_block.rs` (new; marker validation, candidate construction, atomic write)
- `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock` for direct TOML validation support
- `src-tauri/tests/fixtures/text/herdr-*.toml` and `src-tauri/tests/fixtures/themes/herdr-theme.toml` (new realistic fixtures)
- `src-tauri/tests/setup_smoke.rs`
- `src/components/settings/adapter-pages/herdr.tsx` (new)
- `src/components/settings/adapter-pages/index.ts`
- `src/routes/dev/components.tsx`
- `src/bindings.ts` (generated by backend tests)
- `README.md`
- `ADAPTERS.md`

### Dots (`../../nikbrunner/dots`)

- `common/.config/herdr/config.toml`
- `common/.config/black-atom/livery/config.json`

## Reuse

- `.agents/skills/core-new-adapter/SKILL.md` and `docs/adapter_development-guide.md` — adapter layout, Eta generation, semantic-token rule, and verification.
- `../lazygit/black-atom-adapter.json` — current canonical collection/theme list, including Paper and newer MNML variants.
- `../lazygit/themes/*/collection.template.yml` — simple Merged adapter template convention.
- `../livery/src-tauri/src/updaters/lazygit.rs` — selected downloaded file path construction for a Merged adapter.
- `../livery/src-tauri/src/updaters/file_ops/text.rs` — `$HOME` write guard, symlink-safe atomic write, and fixture-test pattern to extract/reuse rather than reimplement inconsistently.
- `../livery/src-tauri/src/updaters/ghostty.rs` and `tmux.rs` — patch-success/reload-failure result semantics and process execution style.
- `../livery/src-tauri/src/themes/registry.rs` — provisioning, distribution, extraction layout, and editable-field registry.
- `../livery/src/components/settings/adapter-pages/lazygit.tsx` — Merged adapter settings composition.
- `../livery/.claude/skills/backend-testing/SKILL.md` — realistic full-file fixtures and mandatory idempotency coverage.
- `../livery/docs/design-system/reference/SKILL.md` — existing settings primitives and Warm Precision constraints; no bespoke UI styling is planned.
- `../../nikbrunner/dots/common/.config/herdr/config.toml` and `HANDOFF-2026-07-21-herdr-adapter.md` — validated Herdr mapping and real config fixture shape.

## Steps

- [ ] Scaffold the Herdr adapter with the current six-collection theme matrix and standard repository metadata.
- [ ] Implement the semantic token template, including the derived separator surface, and generate every committed `.toml` fragment.
- [ ] Validate representative dark/light generated fragments against Herdr's 16-field schema and visually compare the Terra Summer Day result with the hand-validated reference.
- [ ] Add Herdr to Livery's app enum/default migration, Merged provisioning/distribution registry, detection, and editable-field matrix.
- [ ] Add the fail-safe managed-block file operation with TOML validation, atomic writes, and fixture-based edge-case/idempotency tests.
- [ ] Add the Herdr updater to read the selected managed fragment, patch the target, invoke/parse `herdr server reload-config`, and dispatch from `update_app`.
- [ ] Extend Livery's hermetic setup smoke test with a Herdr tarball/config and verify that Merged setup downloads but does not link files.
- [ ] Add the Herdr settings page using existing Merged adapter components; update the dev fixture and regenerate TypeScript bindings.
- [ ] Update Livery's supported-app and provisioning documentation.
- [ ] Add managed markers and the enabled Herdr app entry to dots without disturbing unrelated config or current theme behavior.
- [ ] After local verification, initialize/commit the adapter and create the authorized public `black-atom-industries/herdr` GitHub repository on `main`, then push it so Livery's real download path can be tested.
- [ ] Before any commits, inspect each repository's diff and ask for semantic commit-message approval as required by the organization commit workflow; stage only this task's files and never the unrelated pre-existing core/Livery/dots changes.

## Verification

### Adapter

- Run `cd ../herdr && deno task generate` twice; the second run must produce no diff.
- Validate all generated files as TOML; assert one marker pair, one `[theme]`, one `[theme.custom]`, all 16 fields, `#rrggbb` values, and no `undefined`/direct primary references.
- Inspect at least Terra Summer Day (light) and JPN Koyo Yoru/default dark output; confirm surface ordering remains visible and colors are cohesive.

### Livery

- Run `cd ../livery/src-tauri && cargo test` (regenerates `src/bindings.ts`).
- Run `cd ../livery && deno task checks`.
- Fixture cases: existing valid block replacement, two-pass idempotency, safe append, unmanaged theme-table refusal, missing/duplicate/reversed markers, invalid source/final TOML, missing source file, path outside `$HOME`, and preservation of all bytes outside the block.
- Smoke-test the full setup chain: detect Herdr config, download collection output, classify as Merged, skip linking, verify config path, and apply a fixture theme.
- Exercise reload result parsing for `applied`, `partial`, `failed`, command-not-found, server-not-running, and malformed output.

### End to end

- Confirm the public adapter repository's HEAD tarball is downloadable, then run Livery theme sync against it and verify files land under `~/.config/black-atom/themes/herdr/<collection>/`.
- Apply one light and one dark theme from Livery; confirm only the marked block changes and the running Herdr instance repaints without restart.
- Reapply the same theme and confirm no config diff.
- Run `herdr config` validation/reload and inspect the sidebar separator, scrollbar track/thumb, focused/unfocused pane borders, text, and feedback colors.
- Confirm the dots symlink remains intact and both modified dots files contain only the intended Herdr/Livery additions.
