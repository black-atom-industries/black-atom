# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Lazygit adapter** for the Black Atom theme ecosystem. Theme files are generated from the [core repository](https://github.com/black-atom-industries/core) using the Eta template engine.

**Key principle**: This repository contains generated output files. To modify themes, either:
1. Edit the template files in this repository, then regenerate
2. Modify theme definitions in the core repository (for color changes)

## Commands

### Generate Themes (requires core CLI)

```bash
# From this directory (requires black-atom-core CLI installed)
black-atom-core generate

# Or from the core repository (generates all adapters)
cd ../core && deno task adapters:gen
```

### Install Core CLI

```bash
cd ../core && deno task cli:install
```

## Architecture

```
lazygit/
├── black-atom-adapter.json     # Adapter configuration (maps themes to templates)
└── themes/
    └── {collection}/
        ├── collection.template.yml   # Eta template (edit this)
        └── black-atom-*.yml          # Generated theme files (don't edit directly)
```

### Adapter Configuration

`black-atom-adapter.json` defines which themes use which templates. All themes in a collection share the same template file.

### Template Syntax

Templates use Eta syntax to inject theme values:

```yaml
activeBorderColor:
  - "<%= theme.ui.fg.accent %>"
  - bold
defaultFgColor:
  - "<%= theme.ui.fg.default %>"
```

### Available Token Paths

Use these in templates (never use `theme.primaries.*` directly):

- **UI colors**: `theme.ui.fg.default`, `theme.ui.fg.accent`, `theme.ui.fg.subtle`, `theme.ui.bg.default`, `theme.ui.bg.selection`, `theme.ui.bg.hover`
- **Palette**: `theme.palette.red`, `theme.palette.blue`, `theme.palette.yellow`, `theme.palette.magenta`, etc.
- **Meta**: `theme.meta.label`, `theme.meta.appearance`

## Lazygit Theme Properties

Key theme properties mapped from Black Atom tokens:

| Lazygit Property | Black Atom Token | Purpose |
|-----------------|------------------|---------|
| `activeBorderColor` | `ui.fg.accent` | Focused panel border |
| `inactiveBorderColor` | `ui.fg.subtle` | Unfocused panel border |
| `selectedLineBgColor` | `ui.bg.selection` | Selected item background |
| `defaultFgColor` | `ui.fg.default` | Default text color |
| `unstagedChangesColor` | `ui.fg.negative` | Unstaged file indicator |
| `searchingActiveBorderColor` | `palette.yellow` | Search mode border |

## Testing Changes

1. Edit the template file (e.g., `themes/jpn/collection.template.yml`)
2. Run `black-atom-core generate`
3. Test in Lazygit using one of the methods from README.md
