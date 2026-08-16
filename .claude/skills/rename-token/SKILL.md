---
name: rename-token
description: Rename a color token across core and every template. Load when renaming a key under theme.ui, theme.syntax, theme.palette, or theme.primaries — anywhere from the type definition down to adapter templates and the monitor app.
user-invocable: false
---

# Rename Token

A color token is a key under `theme.ui`, `theme.syntax`, `theme.palette`, `theme.primaries`, or
`theme.feedback` in `ThemeDefinition`. Renaming one touches the type, every collection's color
creators, every adapter template that reads it, and the monitor app if it displays the raw path.

`theme.primaries.*` is meant to stay core-only per `core/UBIQUITOUS_LANGUAGE.md`, but
`adapters/nvim/lua/black-atom/themes/*/collection.template.lua` and
`adapters/obsidian/themes/*/collection.template.css` read it today for every collection. Grep for
primaries renames too; don't skip adapters on the assumption the rule is enforced.

## Steps

1. Read `core/src/types/theme.ts` and find the exact interface for the group (`ThemeUiColors`,
   `ThemeSyntaxColors`, `ThemePaletteColors`, `ThemePrimaryColors`, `ThemeFeedbackColors`, possibly
   nested one level, e.g. `ThemeUiColors.bg`). Rename the key there first.
2. Rename the key everywhere it's set. Theme files under `core/src/themes/<collection>/*.ts` do
   not set `ui`/`syntax`/`palette`/`feedback` directly, they call shared creator functions. Edit
   the creators, one pair per collection (`default`, `jpn`, `terra`, `stations`, `mnml`, `paper`):
   - `ui` → `core/src/themes/<collection>/create-ui-dark.ts` and `create-ui-light.ts`
   - `syntax` → `create-syntax-dark.ts` and `create-syntax-light.ts`
   - `palette` → `create-palette-dark.ts`, `create-palette-light.ts`, and the shared
     `core/src/themes/create-palette.ts`
   - `primaries` → each theme file directly, e.g. `core/src/themes/default/black-atom-default-dark.ts`
3. Find every template that reads the token, across every group in one pass:
   ```
   grep -rln "<old>" adapters --include='*.template.*'
   ```
   Grep the full qualified path (`ui.bg.default`, `palette.darkRed`, `syntax.variable.member`), not
   the bare leaf name — a bare `default` or `red` matches unrelated tokens. This covers
   per-collection templates (`adapters/<name>/themes/<collection>/collection.template.<ext>`), the
   shared single templates (`adapters/herdr/themes/collection.template.toml`,
   `adapters/waybar/themes/collection.template.css`), and nvim's
   `adapters/nvim/lua/black-atom/themes/<collection>/collection.template.lua`. Edit every hit with
   `theme.<old>` to `theme.<new>`.
   One hit doesn't belong to the pipeline:
   `adapters/nvim/lua/black-atom/themes/nord/collection.template.lua` has no `nord` entry in
   `adapters/nvim/black-atom-adapter.json`, so it's never rendered. Leave it alone.
4. Check the monitor app for the same qualified path, in both raw and CSS-var form:
   ```
   grep -rn "<old-qualified-path>" core/monitor/src
   grep -rn "ba-<group>-<old-leaf>" core/monitor/src
   ```
   `core/monitor/src/lib/theme-css-vars.ts` flattens every group into `--ba-<group>-<leaf>` CSS
   custom properties, so a CSS file consuming the old var name breaks silently, no type error.
   `core/monitor/src/hooks/use-ui-preview.ts` and `core/monitor/src/routes/preview/ui.tsx` also
   reference `theme.primaries.*` directly.
5. Update `core/UBIQUITOUS_LANGUAGE.md` if the renamed token is named in a table or the example
   dialogue.
6. From the repo root: `deno task generate`, then `deno task check`, then `deno task test`.
7. Review the generated diff: `git diff --stat adapters/`. It can be empty even for a correct
   rename — renaming `theme.palette.black` to something else changes the template expression, not
   the rendered value, since output keys (e.g. Lua's `black = "..."`) are independent of the source
   token name. An empty diff there is normal for most palette and UI renames, not a sign the rename
   missed something. Confirm by checking the template diff instead
   (`git diff adapters/**/collection.template.*`).
8. One commit spanning core, adapters, and the monitor:
   `refactor(core): rename <old> to <new> black-atom-industries/livery#68`. Omit `(core)` if the
   change reads as spanning the whole repo rather than centered on core.
