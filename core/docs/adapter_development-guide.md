# Black Atom Adapter Development Guide

This guide covers developing adapter templates for the Black Atom theme system.

## Adapter Pattern Overview

The Black Atom theme system uses an adapter pattern to generate platform-specific theme files from
the core theme definitions:

1. **Core Theme Definitions**: TypeScript files that define a theme's colors, UI elements, and
   syntax highlighting
2. **Adapter Templates**: template files specific to each platform (e.g., Neovim, Ghostty, Zed)
3. **Generated Files**: platform-specific theme files created by processing templates with the
   core definitions

## Creating an Adapter

See the `new-adapter` skill (`.claude/skills/new-adapter/SKILL.md`) for the full walkthrough. In
outline:

1. Create `adapters/<name>/`
2. Add a `black-atom-adapter.json` mapping collections to templates
3. Add `deno.json` with `generate` and `dev` tasks
4. Add template files under `themes/<collection>/`
5. Add `./adapters/<name>` to the `workspace` array in the root `deno.json`

### Template Creation

1. Create template files with the `.template.{ext}` naming convention, using the target
   platform's extension (e.g., `.json`, `.lua`, `.css`)
2. Use [Eta template syntax](https://eta.js.org/) for variable interpolation, referencing theme
   properties with `<%= theme.property.path %>`
3. Templates use UI, syntax, or palette colors, never primaries directly

### Adapter Configuration

Configure an adapter with `black-atom-adapter.json`, using collection-based templates and
validated against `core/adapter.schema.json`:

```jsonc
{
    "$schema": "../../core/adapter.schema.json",
    "collections": {
        "jpn": {
            "template": "./themes/jpn/collection.template.json",
            "output": "./themes/jpn",
            "themes": [
                "black-atom-jpn-koyo-yoru",
                "black-atom-jpn-koyo-hiru",
                "black-atom-jpn-tsuki-yoru",
                "black-atom-jpn-murasaki-yoru"
            ]
        },
        "stations": {
            "template": "./themes/stations/collection.template.json",
            "themes": [
                "black-atom-stations-engineering",
                "black-atom-stations-operations",
                "black-atom-stations-medical",
                "black-atom-stations-research"
            ]
        }
        // ... other collections
    }
}
```

A collection can also set `output`, a directory relative to the adapter root that generated files
are written to instead of next to the template. Useful for a single shared template
(`themes/collection.template.json`) that should still emit into per-collection directories, e.g.
`"output": "./themes/jpn"` for the `jpn` collection.

An adapter can also declare a `postGenerate` task, run via `deno task postGenerate` after every
file is written, for adapters that assemble output beyond a one-to-one template render (see
obsidian).

This collection-based approach:

- Reduces template duplication
- Simplifies maintenance
- Keeps themes in the same collection consistent

## Theme Adaptation Process

1. Run `deno task generate` in the adapter directory (or `deno task generate` at the repo root for
   every adapter)
2. The CLI reads the adapter's `black-atom-adapter.json`
3. For each collection, the template is processed for each theme in the collection
4. Variables are replaced with values from the core theme definitions
5. Generated files are written to their specified locations, and `postGenerate` runs if declared

## Best Practices

### Accessing Theme Properties

Adapters never access primaries directly in templates. Instead, use:

- **UI colors**: `<%= theme.ui.bg.default %>`, `<%= theme.ui.fg.accent %>`, etc.
- **Syntax colors**: `<%= theme.syntax.string.default %>`, `<%= theme.syntax.keyword.default %>`, etc.
- **Palette colors**: `<%= theme.palette.red %>`, `<%= theme.palette.blue %>`, etc.

#### Do Not Use:

```
<%= theme.primaries.d10 %>
<%= theme.primaries[0] %>
```

#### Do Use:

```
<%= theme.ui.bg.default %>
<%= theme.syntax.string.default %>
<%= theme.palette.red %>
```

This abstraction keeps adapters stable when the core theme structure changes, since UI, syntax,
and palette colors provide a consistent interface while primaries may evolve.

### Template Organization

#### Individual Theme Templates

Organize template files by theme collection:

```
themes/
  jpn/
    black-atom-jpn-koyo-yoru.template.json
    black-atom-jpn-koyo-hiru.template.json
  stations/
    black-atom-stations-engineering.template.json
    ...
```

#### Collection-Based Templates

Use a single template file per collection with a clear naming convention:

```
themes/
  jpn/
    collection.template.json  # Template for all jpn themes
  stations/
    collection.template.json  # Template for all stations themes
  ...
```

### Testing Templates

After generating theme files:

1. Test them in the target application
2. Verify colors and styling match the intended design
3. Check for platform-specific issues

## Troubleshooting

- **Template Errors**: check variable paths and template syntax
- **Missing Colors**: make sure you're accessing the correct theme properties
- **Adapter Issues**: verify `black-atom-adapter.json` is correctly formatted against
  `core/adapter.schema.json`

## Development Workflow

1. Update template files when changes are needed
2. Run `deno task generate` to regenerate theme files
3. Test the changes in the target application
4. Commit both the template changes and the generated files

## Existing Adapters for Reference

- `adapters/nvim/` - Neovim editor
- `adapters/ghostty/` - Ghostty terminal
- `adapters/zed/` - Zed editor
- `adapters/obsidian/` - Obsidian note-taking app

## Reference

### Theme Structure

```typescript
// Basic theme structure reference
{
  meta: {
    key: "black-atom-jpn-koyo-yoru",
    label: "Black Atom — JPN ∷ Koyo Yoru",
    appearance: "dark",
    collection: { key: "jpn", label: "JPN" },
  },
  // Don't access these directly in templates
  primaries: {
    d10: "#271f27", d20: "#332733", d30: "#3f2f3f", d40: "#4a384a",
    m10: "#605872", m20: "#6e6a86", m30: "#908caa", m40: "#aaa7be",
    l10: "#dab18c", l20: "#e0be9f", l30: "#e6cbb2", l40: "#ecd8c5",
  },
  // Access these in templates
  palette: {
    black: "#3f2f3f", gray: "#6e6a86", dark_red: "#b46371", red: "#eb6f84",
    // ... other colors
  },
  ui: {
    bg: {
      default: "#332733", panel: "#271f27", float: "#271f27",
      // ... other background colors
    },
    fg: {
      default: "#e6cbb2", subtle: "#dab18c", accent: "#e9b162",
      // ... other foreground colors
    }
  },
  syntax: {
    variable: { default: "#e0be9f", builtin: "#aaa7be" },
    string: { default: "#7ab89b", doc: "#7ab89b" },
    // ... other syntax highlighting colors
  }
}
```
