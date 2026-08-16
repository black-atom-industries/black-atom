---
name: bai-obsidian-dev
description: Black Atom Obsidian adapter development workflow. Load when working on the obsidian theme adapter, CSS templates, or testing theme variants.
user-invocable: false
---

# Black Atom Obsidian Adapter — Development

## When to Load

- Editing CSS templates, settings YAML, or UI styles
- Testing or debugging theme variants in Obsidian
- Taking screenshots or inspecting theme rendering

## Build Commands

```bash
deno task build        # Full build: generate tokens → assemble theme.css → format
deno task dev          # Watch mode (rebuilds on template/style changes)
deno task generate     # Generate per-theme CSS from templates only
deno task postGenerate # Assemble theme.css from generated + static files only
deno task fmt          # Format all files
deno task fmt:check    # Check formatting
deno task lint         # Lint all files
```

## Obsidian CLI — Dev Tools

The Obsidian CLI provides dev tools for inspecting and testing themes live
without manually opening DevTools.

### Inspect CSS

```bash
# Check how a CSS variable resolves in the running theme
obsidian dev:css selector=".workspace" prop="--color-base-00" 2>/dev/null

# Inspect all styles on a selector
obsidian dev:css selector=".mod-root .workspace-leaf" 2>/dev/null
```

### Query DOM

```bash
# Check element structure
obsidian dev:dom selector=".workspace-leaf-content" 2>/dev/null

# Get computed text content
obsidian dev:dom selector=".view-header-title" text 2>/dev/null

# Get a specific CSS property value
obsidian dev:dom selector=".workspace" css="background-color" 2>/dev/null
```

### Screenshots

```bash
# Capture current state for comparison
obsidian dev:screenshot path="tmp_screenshots/variant-check.png" 2>/dev/null
```

### Console & Errors

```bash
# Check for CSS/JS errors after theme reload
obsidian dev:errors 2>/dev/null
obsidian dev:console 2>/dev/null
```

### Execute JS

```bash
# Read computed styles programmatically
obsidian eval code="getComputedStyle(document.body).getPropertyValue('--color-accent')" 2>/dev/null

# Check which theme variant class is active
obsidian eval code="document.body.className" 2>/dev/null
```

### Theme Switching

```bash
# Reload the vault after rebuilding theme.css
obsidian reload 2>/dev/null

# Toggle between dark/light to test both variant sets
obsidian command id="theme:switch" 2>/dev/null
```

## Development Workflow with CLI

1. **Edit** template/styles in the repo
2. **Build**: `deno task build`
3. **Reload**: `obsidian reload 2>/dev/null` (if symlinked into vault)
4. **Inspect**: Use `dev:css` / `dev:dom` to verify CSS variables resolve
   correctly
5. **Screenshot**: `obsidian dev:screenshot path="tmp_screenshots/check.png"`
   for visual comparison
6. **Check errors**: `obsidian dev:errors 2>/dev/null`

## Key Files

| File                             | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `themes/collection.template.css` | Shared Eta template — main editing target             |
| `styles/variants.settings.yaml`  | Theme variant dropdowns (Style Settings plugin)       |
| `styles/ui/*.css`                | Static UI customizations (borders, scrollbars)        |
| `styles/ui/*.settings.yaml`      | Style Settings sidecars for UI options                |
| `black-atom-adapter.json`        | Adapter config — maps collections to templates/themes |
| `theme.css`                      | Final assembled output (committed)                    |
| `manifest.json`                  | Obsidian theme metadata                               |

## Theme Object Reference

Available in Eta templates as `theme`:

- `theme.meta` — key, label, appearance, collection
- `theme.primaries` — d10-d40, m10-m40, l10-l40 (dark/mid/light scale)
- `theme.palette` — red, green, blue, yellow, cyan, magenta, darkYellow,
  darkMagenta
- `theme.ui.bg` — default, panel, float, hover, active, selection, search,
  negative, positive, info, warn
- `theme.ui.fg` — default, subtle, disabled, accent, contrast, negative,
  positive, warn
- `theme.syntax` — keyword, func, string, variable, constant, comment, operator,
  property, punctuation, tag, markup.*
