# Black Atom Obsidian Adapter Guide

## Project Overview

This is the Obsidian adapter for Black Atom themes. It uses a pure CSS template
approach -- no SCSS, no npm dependencies. The core CLI processes Eta templates
to generate per-theme CSS files, and a Deno build script assembles them into a
single `theme.css`.

## Repository Structure

```
.
├── .editorconfig
├── .github/
├── .gitignore
├── black-atom-adapter.json        # Adapter config for core CLI
├── CLAUDE.md                      # Project guide
├── deno.json                      # Deno tasks (build, dev, fmt, lint)
├── docs/plans/                    # Design & implementation plans
├── manifest.json                  # Obsidian theme metadata
├── README.md                      # User-facing docs
├── scripts/
│   ├── build.ts                   # Build script
│   └── config.ts                  # Build configuration
├── styles/
│   ├── variants.settings.yaml     # Theme variant dropdowns (Style Settings)
│   └── ui/                        # UI customization CSS + settings sidecars
│       ├── borders.css
│       ├── borders.settings.yaml
│       ├── scrollbars.css
│       └── scrollbars.settings.yaml
├── themes/
│   ├── collection.template.css    # Shared Eta template (all collections)
│   └── *.css                      # Generated per-theme files (gitignored)
└── theme.css                      # Final output (committed)
```

## How the Adapter Pattern Works

1. `black-atom-core generate` reads `black-atom-adapter.json`
2. For each collection, it processes the Eta template once per theme, injecting
   the theme object
3. Generated CSS files land in `themes/` (e.g.
   `themes/black-atom-default-dark.css`)
4. The build script assembles `styles/variants.settings.yaml` +
   `styles/ui/*.settings.yaml` + all generated theme CSS + `styles/ui/*.css`
   into `theme.css`

The `black-atom-adapter.json` maps collections to templates and lists their
themes:

```json
{
    "collections": {
        "default": {
            "template": "themes/collection.template.css",
            "themes": [
                "black-atom-default-dark",
                "black-atom-default-dark-dimmed",
                "black-atom-default-light",
                "black-atom-default-light-dimmed"
            ]
        }
    }
}
```

## Template Syntax Reference

Templates use [Eta](https://eta.js.org/) syntax. The `theme` object is injected
by the core CLI.

**Output a value:**

```
<%= theme.meta.key %>
<%= theme.primaries.d10 %>
<%= theme.palette.red %>
<%= theme.ui.bg.default %>
<%= theme.syntax.keyword.default %>
```

**JavaScript logic:**

```
<% if (theme.meta.appearance === "dark") { %>
  --color-base-00: <%= theme.primaries.d10 %>;
<% } else { %>
  --color-base-00: <%= theme.primaries.l40 %>;
<% } %>
```

**Theme object structure:**

- `theme.meta` -- key, label, appearance, collection
- `theme.primaries` -- d10-d40, m10-m40, l10-l40 (dark/mid/light scale)
- `theme.palette` -- red, green, blue, yellow, cyan, magenta, darkYellow,
  darkMagenta, etc.
- `theme.ui` -- bg (default, panel, float, hover, active, selection, search,
  negative, positive, info, warn), fg (default, subtle, disabled, accent,
  contrast, negative, positive, warn)
- `theme.syntax` -- keyword, func, string, variable, constant, comment,
  operator, property, punctuation, tag, markup (heading, strong, italic, quote,
  link, code)

## Development Workflow

1. Edit the template (`themes/collection.template.css`), settings YAML in
   `styles/`, or UI CSS in `styles/ui/`
2. Run `deno task dev` for watch mode, or `deno task build` for a one-off build
3. Reload Obsidian to see changes

### Symlink Setup

For faster iteration, symlink the output files into your vault:

```bash
mkdir -p ~/path/to/vault/.obsidian/themes/Black-Atom

ln -s ~/repos/black-atom-industries/obsidian/theme.css ~/path/to/vault/.obsidian/themes/Black-Atom/theme.css
ln -s ~/repos/black-atom-industries/obsidian/manifest.json ~/path/to/vault/.obsidian/themes/Black-Atom/manifest.json
```

## Adding New Collections

1. Add the collection to `black-atom-adapter.json` with its template path and
   theme keys (use `themes/collection.template.css` for the shared template)
2. Add the new theme variants to `styles/variants.settings.yaml`
3. Run `deno task build`

## Commands

- `deno task build` -- Full build (generate tokens + assemble theme.css +
  format)
- `deno task dev` -- Watch mode (rebuilds on template/style changes)
- `deno task fmt` -- Format all files
- `deno task fmt:check` -- Check formatting
- `deno task lint` -- Lint all files
