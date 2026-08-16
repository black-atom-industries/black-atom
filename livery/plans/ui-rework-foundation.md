# Plan: UI Rework — CSS Modules Foundation and First Components

> Source PRD: [#29](https://github.com/black-atom-industries/livery/issues/29)

## Architectural decisions

Durable decisions that apply across all phases:

- **Styling**: CSS Modules (`.module.css`) + CVA for variants + `cx()` for class merging. No runtime
  CSS-in-JS. No Tailwind after migration.
- **Component folders**: `components/<name>/<name>.tsx` + `<name>.module.css` + `<name>.stories.tsx`
  - `index.ts` re-export. All kebab-case.
- **Component roles**: Dumb (owns styling), Container (routes, owns data), Partial (composition, no
  styling), Layout (`*Layout` suffix, structural CSS only).
- **Data attributes**: Every component root element gets `data-component="<name>"`,
  `data-layout="<name>"`, etc.
- **CVA pattern**: `cva(styles.root, { variants: { ... } })` mapping variant values to CSS Module
  classes. Props type: `VariantProps<typeof variants> & native HTML attributes & custom props`.
- **Color tokens**: Import `@black-atom/core` from JSR. Build a token mapping module that reads core
  theme definitions (OKLCH values) and generates CSS custom properties on `:root` or a container
  element. Components consume `var(--bg-default)`, `var(--fg-subtle)`, etc. A ThemeProvider or
  equivalent sets the active theme's tokens. This is built in Phase 1 — no manual token files.
- **Typography tokens**: CSS custom properties `var(--font-display)`, `var(--font-body)`,
  `var(--font-mono)` with system fallbacks. Typography system lands separately.
- **Visual dev**: Storybook 10 via `@storybook/react-vite` on Deno. Fallback: `/dev` TanStack Router
  route that imports and renders each component with all variant combinations. Excluded from
  production builds via route guard or lazy loading. Minimal layout — just a vertical list of
  component sections.

---

## Phase 1: Styling infrastructure + Badge

**User stories**: 1, 3, 4, 8

### What to build

Set up CSS Modules + CVA as the project's styling foundation. Build a **token mapping module** that
imports `@black-atom/core` theme definitions from JSR and maps their UI color tokens to CSS custom
properties. This proves the full pipeline: core theme → CSS variables → component styling.

Research and spike Storybook with Deno + Vite (if it fails, set up a `/dev` route instead). Add a
**global Storybook decorator** (or equivalent in `/dev` route) that lets you switch between all
available `@black-atom/core` themes — proving the token system works end-to-end and giving a visual
comparison tool for free.

Build **Badge** as the first Dumb Component to prove the component pattern: folder structure, CSS
Module consuming token variables, CVA variants, data attribute, re-export, and story entry.

Badge is an appearance tag showing `light` or `dark`. It has CVA variants for appearance type.
Visually: 1px border, monospace uppercase text, squared corners, small sizing.

### Acceptance criteria

- [x] CSS Modules working in Vite config (`.module.css` imports resolve)
- [x] CVA installed and usable (`cva`, `cx`, `VariantProps` imports work)
- [x] Token mapping module imports `@black-atom/core` and generates CSS custom properties
- [x] CSS variables set on `:root` or container (`--bg-default`, `--fg-default`, `--fg-subtle`,
      etc.)
- [x] Storybook running OR `/dev` route rendering components — `/dev` route chosen, Storybook
      abandoned (CJS/ESM + Deno friction)
- [x] Global decorator/wrapper allows switching between core themes (all collections/appearances)
- [x] `components/badge/` folder with `badge.tsx`, `badge.module.css`, `index.ts` — story file N/A,
      showcased via `/dev/primitives` instead
- [x] Badge renders with `data-component="badge"` on root element
- [x] Badge has CVA variants for appearance (`light`, `dark`) with distinct visual treatment
- [x] Badge consumes CSS custom properties from the token system (no hardcoded colors)

---

## Phase 2: Button + ColorSwatch — DEFERRED

**Status**: Not started. Deferred to after the upcoming Claude Design pass — these specs predate
that process and will likely be reworked once the design direction (search/filter, theme datasheet,
settings, etc.) lands. Tracked in follow-up issue #48.

**User stories**: 9, 10

### What to build

Build **Button** with the bracket-actuator pattern `[ LABEL ]` and **ColorSwatch** as a single
bordered color square with hex label. ColorSwatch composes into **ColorSwatchRow** (a Partial) with
a category label above a row of swatches.

Button has CVA variants: primary (filled contrast background, inverse text), secondary (1px border,
transparent fill), disabled (muted). All monospace uppercase text.

ColorSwatch receives a hex color and optional role label. It renders a bordered square filled with
the color and the hex value in monospace below.

### Acceptance criteria

- [ ] `components/button/` with full folder structure and story
- [ ] Button renders bracket notation `[ LABEL ]` with 3 CVA variants (primary, secondary, disabled)
- [ ] Button has `data-component="button"` on root element
- [ ] `components/color-swatch/` with full folder structure and story
- [ ] ColorSwatch renders a bordered square with hex label
- [ ] `partials/color-swatch-row/` composes ColorSwatch instances with a category label
- [ ] ColorSwatchRow has `data-partial="color-swatch-row"` on root element

---

## Phase 3: Migrate + redesign existing components

**User stories**: 5, 6, 7

### What to build

Migrate all 5 existing components from Tailwind inline classes to CSS Modules. During migration,
redesign each to match `design/DESIGN.md`: 1px borders, squared corners, monospace labels, proper
spacing, data attributes. Each component moves from its current flat file (e.g.
`src/components/app-header.tsx`) into a proper component folder
(`src/components/app-header/app-header.tsx` + `.module.css` + `index.ts`). Old flat files are
deleted after migration.

Components to migrate and redesign:

- **AppHeader** — title bar with "BLACK ATOM LIVERY" wordmark + version in design language style
- **AppFooter** — status bar with keyboard shortcut hints in monospace
- **ThemeList** — grouped theme list with uppercase mono collection headers, appearance indicators,
  selection highlight
- **ThemeDetail** — theme preview with metadata rows, swatch area placeholder, description
- **ProgressBar** — updater progress with status indicators matching the design language

Each gets a proper component folder, CSS Module, data attribute, and story/dev entry.

### Acceptance criteria

- [x] All 5 components use CSS Modules, zero Tailwind classes remain in any source file
- [x] Old flat component files deleted, all components live in folder convention
- [x] Each component has its own folder with `.module.css` and dev entry (via `/dev/components`)
- [x] AppHeader matches design language (mono wordmark, version label, horizontal rule)
- [x] AppFooter shows keyboard hints in monospace, sync status
- [x] ThemeList renders collection groups with uppercase mono headers and theme counts
- [x] ThemeDetail shows theme name in display font, metadata rows, placeholder for swatches
- [x] ProgressBar uses square status pips and mono labels
- [x] All components have `data-component` attributes

---

## Phase 4: Remove Tailwind + housekeeping

**User stories**: 2

### What to build

Remove Tailwind from the project entirely. Clean up configuration, remove unused packages, and
update documentation to reflect the new styling system.

### Acceptance criteria

- [x] `tailwindcss` and `@tailwindcss/vite` removed from `deno.json`
- [x] Tailwind import removed from `src/index.css` (or file removed/replaced)
- [x] Vite config no longer references Tailwind plugin
- [x] `src/AGENTS.md` updated: "Styling: CSS Modules + CVA" (not Tailwind)
- [x] App builds and runs cleanly with no Tailwind references
- [x] No Tailwind utility classes remain anywhere in the codebase
