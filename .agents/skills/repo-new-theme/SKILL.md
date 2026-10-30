---
name: repo-new-theme
description: Add a theme to an existing collection. Load when asked to create, design, or add a new Black Atom theme, variant, or appearance, or to rework an existing theme's colors.
---

# New Theme

1. Design the theme with the user before writing code: which collection (the `collections` tuple in
   `core/src/themes/catalog.ts` lists them), what name, dark and/or light appearance, and what makes
   it fit the collection's concept. Read one or two existing files in
   `core/src/themes/<collection>/` for the collection's palette rules first: how many accent tokens
   it uses and which palette colors it overrides or derives. The theme key is
   `black-atom-<collection>[-<name>]-<dark|light>`.

2. Create `core/src/themes/<collection>/black-atom-<collection>-<name>-<appearance>.ts`. Copy the
   closest sibling file in the same collection, keep its `defineThemeColors()` shape (primaries,
   then value-or-creator inputs for accents, palette, feedback, UI, and syntax) and only change
   `primaries`, `accents`, and any per-collection palette overrides. Colors go through
   `oklch()` from `core/src/utils/color.ts`. No comments in theme definition files.

   A color that exists in both appearances keeps its hue and changes lightness: the dark variant
   is a step lighter than the light one, usually with a little less chroma. This holds for accents
   and for palette colors set in an `override`. Compare a dark and light sibling in the collection
   to see the step it uses.

   When the user gives reference material (photos, products, palettes), sample its colors and use
   them as they are, apart from that lightness step between appearances. Never shift lightness,
   chroma, or hue for contrast. After the theme generates, report weak contrast pairs from
   `npm run contrast <theme-key>` and let the user decide whether to change them.

3. Register the key in `core/src/themes/<collection>/mod.ts`: import the new theme file and add
   one `{ meta: { name, appearance, status }, colors }` entry to `defineCollection()`'s `themes`
   map. Collection `meta` owns `key`, `label`, and `order`; the helper derives theme keys, labels,
   and collection metadata. The `collections` tuple in `core/src/themes/catalog.ts` drives key
   types, and `themeCatalog` combines the collections' `.themes` maps.

4. Run `npm run check` from the repo root and fix any type errors before touching adapters.

5. Add the theme key to every adapter that declares this collection: open each
   `adapters/<name>/black-atom-adapter.json` and append the key to that collection's `themes`
   array, keeping existing order. `grep -l '"<collection>"' adapters/*/black-atom-adapter.json` lists
   them. Three hand-kept lists also name every theme: add an entry to
   `livery/core/tests/fixtures/catalog.json`, the theme alias in
   `adapters/nvim/lua/black-atom/types.lua`, and an option in
   `adapters/obsidian/styles/variants.settings.yaml`.

6. Run `npm run generate` from the repo root. It regenerates every adapter that has a
   `black-atom-adapter.json` in the current tree.

7. Verify one generated output file per adapter that declares the collection. Outputs live at
   `adapters/<name>/themes/<collection>/<theme-key>.<ext>`, except nvim's colorschemes at
   `adapters/nvim/colors/<theme-key>.lua`. Check each adapter's `output` and sibling output
   before asserting a path.

8. Run `npm run check` and `npm run test` from the repo root, both must be green.

9. Commit through `repo-commit` as `feat: add <collection> <name> theme` (no scope, the change
   spans `core` and several adapters).

## Contrast

When a theme's colors are reworked for readability, `npm run contrast <theme-key>` lists every
Contrast Pair with its WCAG ratio, and the Theme Lab (`npm run dev`, then
`/dev/themes?key=<theme-key>`) shows the theme next to its last commit. The user judges by eye
there.

- A theme's identity outranks the number. A signature accent keeps its value even below 3:1;
  darkened oranges and yellows turn red, brown, or olive. Monochrome themes keep their grays gray.
- Darken with saturation: a color that gets darker on a light ground, or lighter on a dark one, also
  gets more chroma, so it stays lively. Chroma barely moves the WCAG ratio, but it reads better.
- 3:1 guides syntax and terminal colors. Feedback and git text aims for 4.5:1 on `bg.default` and
  clearly above 3:1 on its own tint.
- Fills are exempt: cursor, badges, selection, and `fg.accent` used as a fill. `fg.disabled` is
  meant to be faint.
- Light diff backgrounds are dedicated pastels, `oklch(0.9, 0.07, h)` for add and modify and
  `oklch(0.93, 0.04, h)` for delete, with `h` the git color's hue. Feedback tints sit at about 15%
  on light grounds and 20 to 30% on dark ones. `pastel` in a collection's `create-ui-light.ts` holds
  the pattern.
- A gray ladder keeps even steps; when one step moves, its neighbors move too.
