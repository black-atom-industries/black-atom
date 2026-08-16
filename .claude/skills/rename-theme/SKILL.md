---
name: rename-theme
description: Use when renaming a theme key across core, every adapter, and generated files.
user-invocable: false
---

# Rename Theme

Renames `black-atom-<collection>-<old>` to `black-atom-<collection>-<new>` everywhere it appears,
in one commit. Example below uses collection `mnml`, old name `eink`, new name `paper-white`.

1. Confirm the old key exists and the new key is free:
   `grep -rn "black-atom-<collection>-<new>" core adapters` should return nothing.

2. Rename the definition file in `core/src/themes/<collection>/`:
   `git mv core/src/themes/<collection>/black-atom-<collection>-<old>-dark.ts
   core/src/themes/<collection>/black-atom-<collection>-<new>-dark.ts` (repeat per appearance
   suffix the theme has, e.g. `-dark`, `-light`).

3. Update the four core registration points, in this order:
   - `core/src/types/theme.ts`: the key string inside the `themeKeys` array.
   - `core/src/types/themes.ts`: the object key and the `key:` field in `rawThemeKeyMetaMap`, and
     the `name:` field if the display name is changing too.
   - `core/src/themes/map.ts`: the import path (now pointing at the renamed file), the import
     identifier, and the object key in `themeMap`.
   - The renamed definition file itself: the string passed to `themeKeyMetaMap[...]`.

4. If the renamed key is `DEFAULT_THEME_KEY` (in `core/src/types/theme.ts`), also update that
   constant, `livery/src/store/app.ts`, and `livery/src/lib/themes_test.ts`. Otherwise skip this
   step; renaming a non-default theme normally needs no livery change.

5. Update every adapter config in one pass:
   `grep -rl "black-atom-<collection>-<old>" adapters/*/black-atom-adapter.json` then edit each
   match, replacing the old key with the new one in the `themes` array. All ten adapters
   (ghostty, herdr, lazygit, niri, nvim, obsidian, tmux, waybar, wezterm, zed) share one
   `black-atom-adapter.json` schema; only the ones listing this theme need the edit.

6. nvim also hand-maintains a loader stub outside the generated tree, one per theme, at
   `adapters/nvim/colors/black-atom-<collection>-<old>-<appearance>.lua`. `deno task generate`
   never writes this file, so rename it explicitly:
   `git mv adapters/nvim/colors/black-atom-<collection>-<old>-<appearance>.lua
   adapters/nvim/colors/black-atom-<collection>-<new>-<appearance>.lua`, then edit the `require(...)`
   path inside it to the new key. Repeat per appearance.

7. Search the rest of livery for a hardcoded reference to this specific key (most renames find
   nothing here, since livery normally reads keys through `themeMap`):
   `grep -rn "black-atom-<collection>-<old>" livery/src livery/src-tauri`. Fix any hit.

8. Delete the stale generated files rather than renaming them by hand:
   `find adapters -name "black-atom-<collection>-<old>.*" -delete` (this catches every adapter's
   generated output, e.g. `adapters/*/themes/<collection>/black-atom-<collection>-<old>-*.<ext>`
   and nvim's `adapters/nvim/lua/black-atom/themes/<collection>/black-atom-<collection>-<old>-*.lua`).
   This does not touch the `colors/*.lua` loader from step 6, since that filename now already
   carries the new key.

9. Run `deno task generate` from the repo root to regenerate every adapter's output for the new
   key. Confirm the new generated files exist and no `black-atom-<collection>-<old>` file remains
   under `adapters/`.

10. obsidian layers its own build on top of generation (`postGenerate`, `build` in
    `adapters/obsidian/deno.json`), which touches `adapters/obsidian/theme.css` and
    `adapters/obsidian/styles/variants.settings.yaml`. If this theme is in the obsidian adapter,
    rerun `cd adapters/obsidian && deno task build` and check those two files for the old key.

11. Run `deno task check` (type check, lint, format check) and `deno task test` (Deno tests plus
    `cargo test`) from the repo root. Both must be clean.

12. Commit everything as one commit: `refactor(<collection>): rename <old> theme to <new>
    black-atom-industries/livery#68`.
