---
name: new-theme
description: Add a theme to an existing collection. Load when asked to create, design, or add a new Black Atom theme, variant, or appearance.
---

# New Theme

1. Design the theme with the user before writing code: which collection (`default`, `facility`,
   `terra`, `jpn`, `clay`, `minium`, `mono`), what name, dark and/or light appearance, and what makes
   it fit the collection's concept. Read one or two existing files in
   `core/src/themes/<collection>/` for the collection's palette rules first, for example
   `core/src/themes/terra/black-atom-terra-winter-dark.ts` or
   `core/src/themes/clay/black-atom-clay-dark.ts`. `terra` derives palette colors with hue
   shifts per season, `clay` uses two accent tokens (`a10`, `a20`), `default`
   overrides palette cyan/magenta from accents. The theme key is
   `black-atom-<collection>[-<name>]-<dark|light>`.

2. Create `core/src/themes/<collection>/black-atom-<collection>-<name>-<appearance>.ts`. Copy the
   closest sibling file in the same collection, keep its `defineThemeColors()` shape (primaries,
   then value-or-creator inputs for accents, palette, feedback, UI, and syntax) and only change
   `primaries`, `accents`, and any per-collection palette overrides. Colors go through
   `oklch()` from `core/src/utils/color.ts`. No comments in theme definition files.

3. Register the key in `core/src/themes/<collection>/mod.ts`: import the new theme file and add
   one `{ meta: { name, appearance, status }, colors }` entry to `defineCollection()`'s `themes`
   map. Collection `meta` owns `key`, `label`, and `order`; the helper derives theme keys, labels,
   and collection metadata. The `collections` tuple in `core/src/themes/catalog.ts` drives key
   types, and `themeCatalog` combines the collections' `.themes` maps.

4. Run `deno task check` from the repo root and fix any type errors before touching adapters.

5. Add the theme key to every adapter that declares this collection: open each
   `adapters/<name>/black-atom-adapter.json` and append the key to that collection's `themes`
   array, keeping existing order. All eleven adapter dirs (`ghostty`, `herdr`, `lazygit`, `niri`,
   `nvim`, `obsidian`, `tmux`, `tuicr`, `waybar`, `wezterm`, `zed`) declare the seven collections and
   their 32 current themes.

6. Run `deno run -A core/src/tasks/generate.ts` from the repo root. It regenerates every adapter that has a
   `black-atom-adapter.json` in the current tree.

7. Verify one generated output file per adapter that declares the collection. Outputs live at
   `adapters/<name>/themes/<collection>/<theme-key>.<ext>`, except nvim's colorschemes at
   `adapters/nvim/colors/<theme-key>.lua`. Check each adapter's `output` and sibling output
   before asserting a path.

8. Run `deno task check` and `deno task test` from the repo root, both must be green.

9. Commit with `feat: add <collection> <name> theme black-atom-industries/livery#68` (no scope,
   the change spans `core` and multiple adapters).
