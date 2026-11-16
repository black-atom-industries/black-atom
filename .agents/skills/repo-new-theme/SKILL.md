---
name: repo-new-theme
description: Add a theme to an existing collection, or rework an existing theme's colors. Load when asked to create, design, or add a new Black Atom theme, variant, or appearance, or to rework a theme's colors. For a new collection, load repo-new-collection.
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

   For hue across appearances and for reference material, follow `docs/theme-design.md`, Designing a theme.
   After the theme generates, report weak contrast pairs from `npm run contrast <theme-key>` and let
   the user decide whether to change them.

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

When a theme's colors are reworked for readability, follow `docs/theme-design.md`, Contrast. Run
`npm run contrast <theme-key>` for the Contrast Pairs and their WCAG ratios, then check the theme on its
Theme Detail Page (`npm run dev`, then `/black-atom/themes/<short-key>`). The user judges by eye there.
