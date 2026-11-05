---
name: repo-new-collection
description: Add a new collection of Black Atom themes, with its creators, catalog and schema registration, tests, Livery fixtures and every adapter's config. Load when asked to add a collection or a new family of themes. For a theme inside an existing collection, load repo-new-theme.
---

# New Collection

The design rules (how its themes take their colors) are in `docs/theme-design.md`. Read it before
writing the creators. This skill covers the wiring.

1. Pick the collection key: lowercase, with hyphens where needed (`tr-1000`). Create
   `core/src/themes/<key>/mod.ts` with `defineCollection()`: `meta` holds `key`, `label` and `order`, and `themes` holds one
   `{ meta: { name, appearance, status }, colors }` entry per theme. `order` sets the picker position.

2. Create the theme files `core/src/themes/<key>/black-atom-<key>-<name>-<dark|light>.ts`, each a `defineThemeColors()` call.
   Copy the closest sibling collection's files.

3. Create the eight creators, a dark and a light file for each group: `create-palette-{dark,light}.ts`,
   `create-feedback-{dark,light}.ts`, `create-ui-{dark,light}.ts` and `create-syntax-{dark,light}.ts`. Copy them from the
   closest sibling. A creator can call the shared helpers in `core/src/themes/` (such as `create-palette.ts`).

4. Register the collection in `core/src/themes/catalog.ts`: import its `mod.ts`, add it to the `collections` tuple, and
   spread its `.themes` into `themeCatalog`. The collection key type comes from the tuple.

5. Add the key to the entries of `collectionEntries` in `core/src/lib/validate-adapter.ts`. The record is typed over every
   collection key, so `npm run check` fails until the key is there.

6. Regenerate the schema with `npm run --workspace core schema`. It rewrites `core/adapter.schema.json`, which lists the
   collection keys.

7. Update the order assertions to the new list: `collectionOrder` in `core/src/themes/catalog.test.ts`, and the grouped
   order in `livery/src/lib/themes_test.ts`.

8. Livery's Rust side:
   - `COLLECTIONS` in `livery/core/src/themes/catalog.rs` is a `[&str; N]`. Add the key, keep the array sorted (the test
     compares it with a sorted set), and change `N` to match.
   - `livery/core/tests/fixtures/catalog.json` gets one entry per new theme.
   - `lists_every_file_sorted` in `livery/core/src/themes/kagi.rs` asserts the length of `names()`. Kagi's `names()`
     holds one name per file stem, and a light and dark pair share a stem. Set the count to the new length.

9. Hand-kept lists: add the theme aliases and the collection alias to `adapters/nvim/lua/black-atom/types.lua`, one option
   per theme to `adapters/obsidian/styles/variants.settings.yaml`, and a `collectionBlurbs` entry in
   `website/src/content/products/black-atom.ts`.

10. Adapter configs: every `adapters/*/black-atom-adapter.json` gets a `collections` block for the key, with `template`,
    `output` when the adapter uses one, and the `themes` array. Kagi's block points at the shared
    `fragments/collection.template.css` with `output: ./fragments/<key>`.
    For lazygit, niri, obsidian, tmux, wezterm and zed, copy the closest sibling's `themes/<sibling>/collection.template.*` to
    `themes/<key>/collection.template.*` and point the block at it.

11. Run `npm run generate`, then check one generated file per adapter in its `output` directory, and the nvim colorscheme at
    `adapters/nvim/colors/`.

12. Run `npm run check` and `npm run test` from the repo root. Both must be green.

13. Commit through `repo-commit` as `feat: add <key> collection`.
