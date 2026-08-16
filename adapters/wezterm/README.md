# Black Atom for WezTerm

> A collection of elegant, cohesive themes for the WezTerm terminal emulator by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **WezTerm adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

- The [core repository](https://github.com/black-atom-industries/core) is the single source of truth for all theme definitions
- Each adapter implements these themes for a specific platform (Neovim, VS Code, terminals, etc.)
- The adapter uses templates to transform core theme definitions into platform-specific files

This modular approach ensures consistent colors and styling across all supported platforms while allowing for platform-specific optimizations.

## Available Themes

Black Atom includes multiple theme collections, each with dark and light variants:

| Collection    | Description                   |
| ------------- | ----------------------------- |
| **Default**   | Core Black Atom themes        |
| **JPN**       | Japanese-inspired themes      |
| **MNML**      | Minimalist accent themes      |
| **Stations**  | Space station-inspired themes |
| **Terra**     | Earth season-inspired themes  |

## Installation

### Prerequisites

- [WezTerm](https://wezfurlong.org/wezterm/index.html) terminal emulator
- [Deno](https://deno.land/) runtime (for generating themes)

### Setup

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/wezterm.git
cd wezterm
```

2. Generate the theme files:

```bash
deno task generate
```

3. Copy the adapted `.toml` files to your WezTerm configuration directory:

```bash
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
config.color_scheme = "Black Atom — JPN ∷ Koyo Yoru"

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
  ["Black Atom — JPN ∷ Koyo Yoru"] = wezterm.color_scheme.load(
    "~/.config/wezterm/colors/black-atom-jpn-koyo-yoru.toml"
  ),
}

-- Use the loaded scheme
config.color_scheme = "Black Atom — JPN ∷ Koyo Yoru"

return config
```

### Theme Installation

For WezTerm to find themes by name, they must be placed in one of these directories:

1. `~/.config/wezterm/colors` (Linux/macOS)
2. `%USERPROFILE%\.config\wezterm\colors` (Windows)

```bash
# Create the colors directory if it doesn't exist
mkdir -p ~/.config/wezterm/colors

# Copy the generated theme files
cp themes/*/*.toml ~/.config/wezterm/colors/
```

## Development

### Generating Themes

Theme files are generated from templates using [Black Atom Core](https://jsr.io/@black-atom/core). You need [Deno](https://deno.land/) installed.

```bash
# Generate all theme files
deno task generate

# Or use watch mode for live regeneration
deno task dev
```

### Theme Format

WezTerm themes are TOML files that define terminal colors. Black Atom themes define the following properties:

```toml
# Metadata
[metadata]
author = "Black Atom Industries"
name = "Black Atom — JPN ∷ Koyo Yoru"

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

Our templates use the Eta template engine syntax to inject theme values from the Black Atom core definitions:

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

### Creating New Templates

To create a new template:

1. Create a `.template.toml` file in the appropriate collection directory
2. Use template variables to reference color values from the core definitions
3. Add the template to `black-atom-adapter.json`
4. Adapt the theme using the core CLI

### Adapting Themes

To adapt all themes from the templates:

```bash
deno task generate
```

This will process all template files defined in `black-atom-adapter.json` and create the corresponding `.toml` files.

### Development with Symlinks

For theme development, it's more efficient to use symlinks rather than copying files. This allows you to see changes immediately after adapting new theme files without having to copy them again:

```bash
# Create the WezTerm colors directory if it doesn't exist
mkdir -p ~/.config/wezterm/colors

# Create symlinks for all theme files
find ~/repos/black-atom-industries/wezterm/themes -name "*.toml" -not -name "*.template.toml" -type f -exec ln -sf {} ~/.config/wezterm/colors/ \;

# Or link it to another folder
find ~/repos/black-atom-industries/wezterm/themes -name "*.toml" -not -name "*.template.toml" -type f -exec ln -sf {} path/to/folder/ \;
```

Alternatively, you can create symlinks for specific collections:

```bash
# JPN Collection
ln -sf ~/repos/black-atom-industries/wezterm/themes/jpn/black-atom-jpn-koyo-hiru.toml ~/.config/wezterm/colors/
ln -sf ~/repos/black-atom-industries/wezterm/themes/jpn/black-atom-jpn-koyo-yoru.toml ~/.config/wezterm/colors/
ln -sf ~/repos/black-atom-industries/wezterm/themes/jpn/black-atom-jpn-tsuki-yoru.toml ~/.config/wezterm/colors/

# Stations Collection
ln -sf ~/repos/black-atom-industries/wezterm/themes/stations/black-atom-stations-engineering.toml ~/.config/wezterm/colors/
ln -sf ~/repos/black-atom-industries/wezterm/themes/stations/black-atom-stations-operations.toml ~/.config/wezterm/colors/
ln -sf ~/repos/black-atom-industries/wezterm/themes/stations/black-atom-stations-medical.toml ~/.config/wezterm/colors/
ln -sf ~/repos/black-atom-industries/wezterm/themes/stations/black-atom-stations-research.toml ~/.config/wezterm/colors/

# And so on for Default, Terra, and MNML collections...
```

With symlinks in place, your workflow becomes:

1. Make changes to templates
2. Run `deno task generate`
3. Restart WezTerm or reload your configuration to see changes immediately

## Contributing

Contributions are welcome! If you'd like to improve existing themes or add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Create a pull request

## License

MIT - See [LICENSE](./LICENSE) for details

## Related Projects

- [Black Atom Core](https://github.com/black-atom-industries/core) - Core theme definitions
- [Black Atom for Neovim](https://github.com/black-atom-industries/nvim) - Neovim adapter
- [Black Atom for Zed](https://github.com/black-atom-industries/zed) - Zed editor adapter
- [Black Atom for Ghostty](https://github.com/black-atom-industries/ghostty) - Ghostty terminal adapter
- [Black Atom for Obsidian](https://github.com/black-atom-industries/obsidian) - Obsidian adapter

