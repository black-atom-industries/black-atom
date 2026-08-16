# Obsidian Adapter Restart — Design Document

**Date:** 2026-02-15 **Status:** Approved **Issue:** DEV-177

## Context

The existing Obsidian adapter is a half-baked proof-of-concept: adapter disabled
in config, only Stations/Engineering configured, hardcoded selectors, SCSS/token
build mismatch. A fresh start is needed.

## Goal

Get colors right. No interface changes, no layout tweaks — pure color token
mapping from Black Atom core to Obsidian CSS variables.

## Decisions

| Decision                | Choice                        | Rationale                                                    |
| ----------------------- | ----------------------------- | ------------------------------------------------------------ |
| Architecture            | Pure CSS template (no SCSS)   | Colors only. SCSS adds complexity without value.             |
| Token mapping           | Direct (core → Obsidian vars) | No intermediate layer. Consistent with Ghostty/tmux/zed.     |
| Variant switching       | Style Settings plugin         | All variants in one theme.css. Users pick via dropdown.      |
| Initial scope           | Default collection (4 themes) | Validates dark + light paths. Add collections incrementally. |
| Future CSS shared layer | Deferred                      | Extract if pattern emerges from Obsidian + VSCode + others.  |

## Architecture

```
black-atom-core adapt
    ↓
reads black-atom-adapter.json
    ↓
processes templates/theme.template.css (Eta template)
    ↓
generates theme.css (final output)
```

Single template, single output. Same adapter pattern as all other Black Atom
adapters.

## Output Structure (theme.css)

```css
/* @settings
name: Black Atom
id: black-atom
settings:
  -
    id: theme-variant
    title: Theme Variant
    type: class-select
    allowEmpty: false
    default: black-atom-default-dark
    options:
      - label: "Default: Dark"
        value: black-atom-default-dark
      - label: "Default: Dark Dimmed"
        value: black-atom-default-dark-dimmed
      - label: "Default: Light"
        value: black-atom-default-light
      - label: "Default: Light Dimmed"
        value: black-atom-default-light-dimmed
*/

/* --- Black Atom — Dark --- */
.theme-dark.black-atom-default-dark {
    /* Foundation colors */
    --color-base-00: #...;
    --color-base-05: #...;
    /* ... */

    /* Semantic backgrounds */
    --background-primary: #...;
    --background-secondary: #...;
    /* ... */

    /* Text */
    --text-normal: #...;
    --text-muted: #...;
    /* ... */

    /* Extended colors + RGB variants */
    --color-red: #...;
    --color-red-rgb: R, G, B;
    /* ... */

    /* Headings */
    --h1-color: #...;
    /* ... */

    /* Code / Syntax */
    --code-comment: #...;
    --code-function: #...;
    /* ... */
}

/* --- Black Atom — Light --- */
.theme-light.black-atom-default-light {
    /* same variable set, light values */
}

/* ... more variants ... */
```

## Token Mapping Reference

### Foundation: Base Colors (--color-base-*)

Obsidian's base scale runs from `--color-base-00` (lightest in light / darkest
in dark) to `--color-base-100` (darkest in light / lightest in dark). These map
to our primaries:

| Appearance | Obsidian base scale direction | Core primaries direction  |
| ---------- | ----------------------------- | ------------------------- |
| Dark       | 00=darkest → 100=lightest     | d10→d40, m10→m40, l10→l40 |
| Light      | 00=lightest → 100=darkest     | l40→l10, m40→m10, d40→d10 |

### Semantic Colors

| Obsidian Variable             | Core Token        |
| ----------------------------- | ----------------- |
| `--background-primary`        | `ui.bg.default`   |
| `--background-primary-alt`    | `ui.bg.active`    |
| `--background-secondary`      | `ui.bg.panel`     |
| `--background-secondary-alt`  | `ui.bg.float`     |
| `--background-modifier-hover` | `ui.bg.hover`     |
| `--text-normal`               | `ui.fg.default`   |
| `--text-muted`                | `ui.fg.subtle`    |
| `--text-faint`                | `ui.fg.disabled`  |
| `--text-accent`               | `ui.fg.accent`    |
| `--text-on-accent`            | `ui.fg.contrast`  |
| `--text-error`                | `ui.fg.negative`  |
| `--text-warning`              | `ui.fg.warn`      |
| `--text-success`              | `ui.fg.positive`  |
| `--interactive-accent`        | `ui.fg.accent`    |
| `--text-selection`            | `ui.bg.selection` |
| `--text-highlight-bg`         | `ui.bg.search`    |

### Extended Colors

| Obsidian Variable | Core Token           |
| ----------------- | -------------------- |
| `--color-red`     | `palette.red`        |
| `--color-green`   | `palette.green`      |
| `--color-yellow`  | `palette.yellow`     |
| `--color-blue`    | `palette.blue`       |
| `--color-cyan`    | `palette.cyan`       |
| `--color-purple`  | `palette.magenta`    |
| `--color-orange`  | `palette.darkYellow` |

Each needs an `-rgb` variant (e.g., `--color-red-rgb: 233, 49, 71`).

### Headings

| Obsidian Variable | Core Token                 |
| ----------------- | -------------------------- |
| `--h1-color`      | `syntax.markup.heading.h1` |
| `--h2-color`      | `syntax.markup.heading.h2` |
| `--h3-color`      | `syntax.markup.heading.h3` |
| `--h4-color`      | `syntax.markup.heading.h4` |
| `--h5-color`      | `syntax.markup.heading.h5` |
| `--h6-color`      | `syntax.markup.heading.h6` |

### Code / Syntax Highlighting

| Obsidian Variable    | Core Token                   |
| -------------------- | ---------------------------- |
| `--code-normal`      | `syntax.variable.default`    |
| `--code-comment`     | `syntax.comment.default`     |
| `--code-function`    | `syntax.func.default`        |
| `--code-keyword`     | `syntax.keyword.default`     |
| `--code-operator`    | `syntax.operator.default`    |
| `--code-property`    | `syntax.property.default`    |
| `--code-punctuation` | `syntax.punctuation.default` |
| `--code-string`      | `syntax.string.default`      |
| `--code-tag`         | `syntax.tag.default`         |
| `--code-value`       | `syntax.constant.default`    |
| `--code-background`  | `syntax.markup.code.bg`      |

### Additional Mappings

| Obsidian Variable           | Core Token             |
| --------------------------- | ---------------------- |
| `--bold-color`              | `syntax.markup.strong` |
| `--italic-color`            | `syntax.markup.italic` |
| `--blockquote-border-color` | `syntax.markup.quote`  |
| `--link-color`              | `syntax.markup.link`   |
| `--link-external-color`     | `syntax.markup.link`   |
| `--tag-color`               | `ui.fg.accent`         |
| `--graph-node`              | `ui.fg.accent`         |
| `--graph-line`              | `ui.bg.active`         |

## What Gets Removed

- `src/scss/` — entire directory
- `build.sh` — replaced by `black-atom-core adapt`
- `package.json`, `package-lock.json` — no npm dependencies needed
- `themes/` — old generated output
- `templates/theme-tokens.template.css` — replaced by new template
- `templates/theme-tokens.css` — old generated output
- `templates/manifest.template.json` — not needed (single manifest)
- `templates/manifest.json` — old generated output

## What Gets Created

- `templates/theme.template.css` — new Eta template (the only template)

## What Gets Updated

- `black-atom-adapter.json` — enable adapter, configure Default collection
- `manifest.json` — keep as-is (already correct)
- `CLAUDE.md` — update to reflect new architecture

## Development Workflow

1. Symlink `theme.css` and `manifest.json` into Obsidian vault themes directory
2. Run `black-atom-core adapt` from the obsidian repo to regenerate
3. Reload Obsidian (or use hot-reload plugin) to see changes
4. Install Style Settings plugin to switch between variants

## Future Work (not in scope)

- Add remaining collections (Stations, JPN, Terra, MNML)
- Interface/layout customizations via additional CSS
- Shared CSS adapter package (if pattern emerges from multiple web targets)
- Obsidian community theme store submission
