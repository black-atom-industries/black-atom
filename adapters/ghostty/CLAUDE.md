# Black Atom Ghostty Adapter Guide

## Project Overview

This is the Ghostty adapter for Black Atom themes. It implements the Black Atom theme collections (JPN, Stations, Terra, and CRBN) as Ghostty terminal color schemes. The adapter uses the adapter pattern to adapt theme files from templates using the core definitions.

## Repository Structure

- **themes/**: Theme files organized by collection
  - **jpn/**: Japanese-inspired themes
  - **stations/**: Space station-inspired themes
  - **terra/**: Earth seasons-inspired themes
  - **crbn/**: Carbon-inspired minimal themes
- **black-atom-adapter.json**: Configuration file mapping themes to templates

## Adapter Pattern

This repository implements the adapter pattern for Ghostty:

1. **Template Files**: Each theme has a `.template.conf` file that contains template variables
2. **Adapter Configuration**: The `black-atom-adapter.json` file maps themes to templates
3. **Adapted Files**: The core CLI adapts `.conf` files from templates

## Theme Adaptation Process

1. The core CLI reads the `black-atom-adapter.json` file
2. For each theme, it processes the corresponding template
3. Template variables are replaced with values from the core theme definitions
4. Adapted files are written to the appropriate locations

## Working with Templates

Template files use the Eta template syntax:

```
background = <%= theme.ui.bg.default %>
foreground = <%= theme.ui.fg.default %>
```

Each template includes:

- Background and foreground colors
- Cursor colors
- Selection colors
- Color palette (16 colors)

## Ghostty Theme Configuration

Ghostty uses a simple configuration format for themes:

```
# Basic terminal colors
background = #value
foreground = #value
cursor-color = #value
cursor-text = #value
selection-background = #value
selection-foreground = #value

# 16-color palette
palette = 0=#value  # black
palette = 1=#value  # dark red
palette = 2=#value  # dark green
...
palette = 15=#value # white
```

## Creating New Templates

When creating new templates:

1. Create a `.template.conf` file in the appropriate collection directory
2. Use template variables for all theme properties
3. Add the template to `black-atom-adapter.json`
4. Adapt the theme using the core CLI

## Troubleshooting

- If templates aren't adapting properly, check the `black-atom-adapter.json` file
- Ensure template variable paths match the core theme structure
- Validate templates with the core CLI before deploying

## Updating Multiple Themes

When making changes to multiple themes:

1. Update the templates rather than the adapted files
2. Use the core CLI to re-adapt all themes
3. Test changes with multiple color variants

