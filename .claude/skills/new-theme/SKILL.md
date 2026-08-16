---
name: new-theme
description: Add a theme to an existing collection. Load when asked to create, design, or add a new Black Atom theme, variant, or appearance.
---

# New Theme

1. Design the theme with the user before writing code: which collection (`default`, `jpn`,
   `terra`, `stations`, `mnml`, `paper`), what name, dark and/or light appearance, and what makes
   it fit the collection's concept. Read one or two existing files in
   `core/src/themes/<collection>/` for the collection's palette rules first, for example
   `core/src/themes/terra/black-atom-terra-winter-night.ts` or
   `core/src/themes/mnml/black-atom-mnml-clay-dark.ts`. `terra` derives palette colors with hue
   shifts per season, `mnml` drives everything off two accent tokens (`a10`, `a20`), `default`
   overrides palette cyan/magenta from accents. The theme key is
   `black-atom-<collection>-<name>[-dark|-light]`.

2. Create `core/src/themes/<collection>/black-atom-<collection>-<name>-<appearance>.ts`. Copy the
   closest sibling file in the same collection, keep its shape (imports, `createPalette`,
   `createFeedback`, `createUi`, `createSyntax` calls) and only change `primaries`, `accents` (if
   the collection uses them), and any per-collection palette overrides. Colors go through
   `oklch()` from `core/src/utils/color.ts`. No comments in theme definition files.

3. Register the key in three places:
   - `core/src/types/theme.ts`: add the key string to the `themeKeys` array.
   - `core/src/types/themes.ts`: add an entry to `rawThemeKeyMetaMap` under the right collection
     block, spreading the collection's `...xCollection` default and setting `key`, `name`,
     `appearance`.
   - `core/src/themes/map.ts`: add an import for the new file and an entry in the exported
     `themeMap` object under the matching collection comment. `core/src/cli/generate.ts` imports
     `themeMap` statically, generation silently skips anything missing here.

4. Run `deno task check` from the repo root and fix any type errors before touching adapters.

5. Add the theme key to every adapter that declares this collection: open each
   `adapters/<name>/black-atom-adapter.json` and append the key to that collection's `themes`
   array, keeping existing order. Not all ten adapter dirs (`ghostty`, `herdr`, `lazygit`, `niri`,
   `nvim`, `obsidian`, `tmux`, `waybar`, `wezterm`, `zed`) declare every collection, for example
   `obsidian` has no `paper` block. Skip an adapter for a collection it doesn't declare, don't add
   one.

6. Run `deno task generate` from the repo root. It regenerates every adapter that has a
   `black-atom-adapter.json` in the current tree.

7. nvim only: also create `adapters/nvim/colors/black-atom-<collection>-<name>-<appearance>.lua`
   (today's layout) with:
   ```lua
   local theme = require("black-atom.themes.<collection>.black-atom-<collection>-<name>-<appearance>")

   require("black-atom").load(theme)
   ```
   This file is hand-written, `deno task generate` does not create it.

8. Verify one generated output file per adapter that declares the collection. Layouts differ:
   nested per collection (`ghostty`, `lazygit`, `niri`, `nvim` at
   `lua/black-atom/themes/<collection>/`, `zed`, `herdr` even though it shares one template at
   `themes/collection.template.toml`) versus flat (`waybar`, `wezterm`, `tmux` at
   `themes/black-atom-<collection>-<name>-<appearance>.<ext>`). Check the adapter's existing sibling
   theme output to see which layout applies before asserting a path.

9. Run `deno task check` and `deno task test` from the repo root, both must be green.

10. Commit with `feat: add <collection> <name> theme black-atom-industries/livery#68` (no scope,
    the change spans `core` and multiple adapters).
