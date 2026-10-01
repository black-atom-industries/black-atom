---
name: repo-rename-theme
description: Use when renaming a theme key across core, every adapter, and generated files.
user-invocable: false
---

# Rename Theme

Renames `black-atom-<collection>-<old>` to `black-atom-<collection>-<new>` everywhere it appears,
in one commit.

1. Confirm the old key exists and the new key is free:
   `grep -rn "black-atom-<collection>-<new>" core adapters` should return nothing.

2. Rename the definition file in `core/src/themes/<collection>/`:
   `git mv core/src/themes/<collection>/black-atom-<collection>-<old>-dark.ts
   core/src/themes/<collection>/black-atom-<collection>-<new>-dark.ts` (repeat per appearance
   suffix the theme has, e.g. `-dark`, `-light`).

3. Update `core/src/themes/<collection>/mod.ts`: change the imported filename and identifier,
   then update the key and `meta.name` in `defineCollection()`'s `themes` map. Step 3 of
   `repo-new-theme` explains how that map feeds the catalog.

4. If the renamed key is `DEFAULT_THEME_KEY` (in `core/src/themes/catalog.ts`), also update that
   constant and `livery/src/lib/themes_test.ts`. Otherwise skip this
   step; renaming a non-default theme normally needs no livery change.

5. Update every adapter config in one pass:
   `grep -rl "black-atom-<collection>-<old>" adapters/*/black-atom-adapter.json` then edit each
   match, replacing the old key with the new one in the `themes` array.

6. Search the rest of livery for a hardcoded reference to this specific key (most renames find
   nothing here, since livery normally reads keys through `themeCatalog`):
   `grep -rn "black-atom-<collection>-<old>" livery/src livery/src-tauri`. Fix any hit.

7. Delete the stale generated files rather than renaming them by hand:
   `find adapters -name "black-atom-<collection>-<old>-*" -delete`. This catches every adapter's
   generated output, e.g. `adapters/*/themes/<collection>/black-atom-<collection>-<old>-dark.<ext>`
   and nvim's `adapters/nvim/colors/black-atom-<collection>-<old>-dark.lua`.

8. Run `deno task generate` from the repo root to regenerate every adapter's output for the new
   key. Confirm the new generated files exist and no `black-atom-<collection>-<old>` file remains
   under `adapters/`.

9. Obsidian assembles `adapters/obsidian/theme.css` during central generation. If this theme is
   in the Obsidian adapter, inspect that file and `adapters/obsidian/styles/variants.settings.yaml`
   for the old key after generation.

10. Run `deno task verify` from the repo root (type check, lint, format, clippy, Deno and Rust
    tests). It must be clean.

11. Commit everything as one commit through `repo-commit`:
    `refactor(<collection>): rename <old> theme to <new>`.
