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
   chroma, or hue for contrast. After the theme generates, report weak contrast pairs (token,
   background, ratio) and let the user decide whether to change them.

3. Register the key in `core/src/themes/<collection>/mod.ts`: import the new theme file and add
   one `{ meta: { name, appearance, status }, colors }` entry to `defineCollection()`'s `themes`
   map. Collection `meta` owns `key`, `label`, and `order`; the helper derives theme keys, labels,
   and collection metadata. The `collections` tuple in `core/src/themes/catalog.ts` drives key
   types, and `themeCatalog` combines the collections' `.themes` maps.

4. Run `deno task check` from the repo root and fix any type errors before touching adapters.

5. Add the theme key to every adapter that declares this collection: open each
   `adapters/<name>/black-atom-adapter.json` and append the key to that collection's `themes`
   array, keeping existing order. `grep -l '"<collection>"' adapters/*/black-atom-adapter.json` lists
   them.

6. Run `deno task generate` from the repo root. It regenerates every adapter that has a
   `black-atom-adapter.json` in the current tree.

7. Verify one generated output file per adapter that declares the collection. Outputs live at
   `adapters/<name>/themes/<collection>/<theme-key>.<ext>`, except nvim's colorschemes at
   `adapters/nvim/colors/<theme-key>.lua`. Check each adapter's `output` and sibling output
   before asserting a path.

8. Run `deno task check` and `deno task test` from the repo root, both must be green.

9. Commit through `repo-commit` as `feat: add <collection> <name> theme` (no scope, the change
   spans `core` and several adapters).
