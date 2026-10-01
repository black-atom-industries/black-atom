# Black Atom for WezTerm

> A collection of elegant, cohesive themes for the WezTerm terminal emulator by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **WezTerm adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

## Installation

### Prerequisites

- [WezTerm](https://wezfurlong.org/wezterm/index.html) terminal emulator

### Install the theme files

Generate the theme files (requires [Deno](https://deno.land/)) and copy the `.toml` files to your
WezTerm configuration directory:

```bash
deno run -A ../../core/src/cli/index.ts generate
mkdir -p ~/.config/wezterm/colors
cp themes/*/*.toml ~/.config/wezterm/colors/
```

## Usage

### Method 1: Specifying a Theme in your Configuration

After installing the themes to your WezTerm configuration directory, you can use the `color_scheme` option:

```lua
-- In your ~/.config/wezterm/wezterm.lua file
local wezterm = require('wezterm')
local config = {}

if wezterm.config_builder then
    config = wezterm.config_builder()
end

-- To use a specific theme:
config.color_scheme = "Black Atom — JPN ∷ Koyo Dark"

return config
```

### Method 2: Loading Themes from Files

Alternatively, you can load the themes directly from files:

```lua
-- In your ~/.config/wezterm/wezterm.lua file
local wezterm = require('wezterm')
local config = {}

if wezterm.config_builder then
    config = wezterm.config_builder()
end

-- Load color scheme from file
config.color_schemes = {
  ["Black Atom — JPN ∷ Koyo Dark"] = wezterm.color_scheme.load(
    "~/.config/wezterm/colors/black-atom-jpn-koyo-dark.toml"
  ),
}

-- Use the loaded scheme
config.color_scheme = "Black Atom — JPN ∷ Koyo Dark"

return config
```

### Theme Installation

For WezTerm to find themes by name, they must be placed in one of these directories:

1. `~/.config/wezterm/colors` (Linux/macOS)
2. `%USERPROFILE%\.config\wezterm\colors` (Windows)

## Development

Requirements: [Deno](https://deno.land/).

```bash
deno run -A ../../core/src/cli/index.ts generate  # regenerate theme files
deno run -A ../../core/src/cli/index.ts generate --watch        # watch mode
```

### Theme Format

WezTerm themes are TOML files that define terminal colors. Black Atom themes define the following properties:

```toml
# Metadata
[metadata]
author = "Black Atom Industries"
name = "Black Atom — JPN ∷ Koyo Dark"

# Basic terminal colors
[colors]
foreground = "#e6cbb2"
background = "#332733"
cursor_bg = "#8cc1b0"
cursor_border = "#8cc1b0"
cursor_fg = "#332733"
selection_bg = "#908caa"
selection_fg = "#332733"

# 16-color palette
ansi = [
  "#3f2f3f", # black
  "#b46371", # dark_red
  "#53ad82", # dark_green
  "#ee9c6b", # dark_yellow
  "#ad8593", # dark_blue
  "#ef9d6c", # dark_magenta
  "#68b19a", # dark_cyan
  "#aaa7be", # light_gray
]

brights = [
  "#6e6a86", # gray
  "#eb6f84", # red
  "#7ab89b", # green
  "#e9b162", # yellow
  "#a095a8", # blue
  "#ffb488", # magenta
  "#8cc1b0", # cyan
  "#e6cbb2", # white
]

# Tab bar colors
[colors.tab_bar]
# ... tab bar settings
```

For more information on WezTerm themes, see the [official documentation](https://wezfurlong.org/wezterm/config/appearance.html).

### Template Structure

Templates use the Eta template engine syntax to inject theme values from the Black Atom core
definitions:

```toml
[metadata]
author = "Black Atom Industries"
name = "<%= theme.meta.label %>"

[colors]
foreground = "<%= theme.ui.fg.default %>"
background = "<%= theme.ui.bg.default %>"
cursor_bg = "<%= theme.ui.fg.accent %>"
# ...and so on
```

Templates live at `themes/<collection>/collection.template.toml`. Add a new template to
`black-atom-adapter.json` before generating.

## License

MIT - See [LICENSE](./LICENSE) for details
