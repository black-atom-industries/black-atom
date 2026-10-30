---
name: repo-rename-token
description: Rename a color token across core and every template. Load when renaming a key under theme.ui, theme.syntax, theme.palette, or theme.primaries — anywhere from the type definition down to adapter templates, the contrast analysis, and the website.
user-invocable: false
---

# Rename Token

A color token is a key under `theme.ui`, `theme.syntax`, `theme.palette`, `theme.primaries`, or
`theme.feedback` in `ThemeDefinition`. Renaming one touches the type, every collection's color
creators, every adapter template that reads it, and the TypeScript that names its path: the contrast
analysis and the website.

Adapter templates never read `theme.primaries.*`; they consume semantic UI, syntax, palette, and
feedback tokens.

## Steps

1. Read `core/src/types/theme.ts` and find the exact interface for the group (`Ui`, `Syntax`,
   `Palette`, `Primaries`, `Feedback`, possibly nested one level, e.g. `Ui.bg`). Rename the key
   there first.
2. Rename the key everywhere it's set. Theme files under `core/src/themes/<collection>/*.ts` call
   `defineThemeColors()` with values or creators for each derived group. Check those inputs and
   the creators. Every collection keeps its own creators in its directory:
   - `ui` → `core/src/themes/<dir>/create-ui-dark.ts` and `create-ui-light.ts`
   - `syntax` → `create-syntax-dark.ts` and `create-syntax-light.ts`
   - `palette` → `create-palette-dark.ts`, `create-palette-light.ts`, and the shared
     `core/src/themes/create-palette.ts`
   - `feedback` → `create-feedback-dark.ts`, `create-feedback-light.ts`, and theme inputs
   - `primaries` → each theme file directly, e.g. `core/src/themes/default/black-atom-default-dark.ts`
3. Find every template that reads the token, across every group in one pass:
   ```
   grep -rln "<old>" adapters --include='*.template.*'
   ```
   Grep the full qualified path (`ui.bg.default`, `palette.darkRed`, `syntax.variable.member`), not
   the bare leaf name — a bare `default` or `red` matches unrelated tokens. This covers
   per-collection templates (`adapters/<name>/themes/<collection>/collection.template.<ext>`), the
   shared single templates (`adapters/<name>/themes/collection.template.<ext>`, e.g. ghostty,
   herdr, tuicr, waybar), and nvim's
   `adapters/nvim/templates/collection.template.lua`. Edit every hit with
   `theme.<old>` to `theme.<new>`.
4. Check the TypeScript that names token paths as strings, where a stale path breaks only at
   runtime:
   ```
   grep -rn "<old-qualified-path>" core/src/lib website/src
   ```
   `core/src/lib/contrast-analysis.ts` lists its pairs as strings (`fg.default`, `syntax.string.default`,
   `palette.red`), and the theme lab in `website/src/dev/theme-lab/` names UI pairs and palette slots
   the same way.
5. Update `GLOSSARY.md` if the renamed token is named in a table or the example
   dialogue.
6. From the repo root: `npm run generate`, then `npm run check`, then `npm run test`.
7. Review the generated diff: `git diff --stat adapters/`. It can be empty even for a correct
   rename — renaming `theme.palette.black` to something else changes the template expression, not
   the rendered value, since output keys (e.g. Lua's `black = "..."`) are independent of the source
   token name. An empty diff there is normal for most palette and UI renames, not a sign the rename
   missed something. Confirm by checking the template diff instead
   (`git diff adapters/**/collection.template.*`).
8. One commit through `repo-commit`, spanning core, adapters, and the website:
   `refactor(core): rename <old> to <new>`. Omit `(core)` if the change reads as spanning the
   whole repo rather than centered on core.
