# Black Atom for Ghostty

> A collection of elegant, cohesive themes for the Ghostty terminal by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **Ghostty adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

- The [core repository](https://github.com/black-atom-industries/core) is the single source of truth for all theme definitions
- Each adapter implements these themes for a specific platform (Neovim, VS Code, Alacritty, etc.)
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

- [Ghostty](https://github.com/mitchellh/ghostty) terminal emulator
- [Deno](https://deno.land/) runtime (for generating themes)

### Setup

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/ghostty.git
cd ghostty
```

2. Generate the theme files:

```bash
deno task generate
```

3. Copy the adapted `.conf` files to your Ghostty themes directory:

```bash
COPY_PATH=~/.config/ghostty/themes
mkdir -p $COPY_PATH
cp themes/*/*.conf $COPY_PATH
```

## Usage

Ghostty supports various ways to use themes. Below are the recommended methods for using Black Atom themes with Ghostty.

### Method 1: Using the `theme` Configuration Option

After installing the themes to your Ghostty themes directory, you can use the built-in `theme` option:

```ini
# In your ~/.config/ghostty/config file
theme = black-atom-jpn-koyo-yoru
```

You can also specify different themes for light and dark mode:

```ini
# Use different themes based on system appearance
theme = dark:black-atom-terra-fall-night,light:black-atom-terra-fall-day
```

> Don't forget to [reload your configuration](https://ghostty.org/docs/config#reloading-the-configuration) after changing the theme.

### Method 2: Using the `include` Directive

Alternatively, you can directly include a theme file:

```ini
# In your ~/.config/ghostty/config file
include ~/.config/ghostty/themes/black-atom-jpn-koyo-yoru.conf
```

### Theme Installation

For Ghostty to find themes by name, they must be placed in one of these directories:

1. `$XDG_CONFIG_HOME/ghostty/themes` (typically `~/.config/ghostty/themes`)
2. `$PREFIX/share/ghostty/themes`

```bash
# Create the themes directory if it doesn't exist
mkdir -p ~/.config/ghostty/themes

# Copy the generated theme files
cp themes/*/*.conf ~/.config/ghostty/themes/
```

### Listing Available Themes

To see all available themes including the Black Atom themes:

```bash
ghostty +list-themes
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

Ghostty themes are simple configuration files that set color options. Black Atom themes define the following properties:

```ini
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
...
palette = 15=#value # white
```

For more information on Ghostty themes, see the [official documentation](https://ghostty.org/docs/features/theme).

### Template Structure

Our templates use the Eta template engine syntax to inject theme values from the Black Atom core definitions:

```ini
background = <%= theme.ui.bg.default %>
foreground = <%= theme.ui.fg.default %>
cursor-color = <%= theme.ui.fg.accent %>
# ...and so on
```

### Creating New Templates

To create a new template:

1. Create a `.template.conf` file in the appropriate collection directory
2. Use template variables to reference color values from the core definitions
3. Add the template to `black-atom-adapter.json`
4. Adapt the theme using the core CLI

### Adapting Themes

To adapt all themes from the templates:

```bash
deno task generate
```

This will process all template files defined in `black-atom-adapter.json` and create the corresponding `.conf` files.

### Development with Symlinks

For theme development, it's more efficient to use symlinks rather than copying files. This allows you to see changes immediately after adapting new theme files without having to copy them again:

```bash
# Create the Ghostty themes directory if it doesn't exist
mkdir -p ~/.config/ghostty/themes

# Create symlinks for all theme files
find ~/repos/black-atom-industries/ghostty/themes -name "*.conf" -type f -exec ln -sf {} ~/.config/ghostty/themes/ \;
```

Alternatively, you can create symlinks for specific collections:

```bash
# JPN Collection
ln -sf ~/repos/black-atom-industries/ghostty/themes/jpn/black-atom-jpn-koyo-hiru.conf ~/.config/ghostty/themes/
ln -sf ~/repos/black-atom-industries/ghostty/themes/jpn/black-atom-jpn-koyo-yoru.conf ~/.config/ghostty/themes/
ln -sf ~/repos/black-atom-industries/ghostty/themes/jpn/black-atom-jpn-tsuki-yoru.conf ~/.config/ghostty/themes/

# Stations Collection
ln -sf ~/repos/black-atom-industries/ghostty/themes/stations/black-atom-stations-engineering.conf ~/.config/ghostty/themes/
ln -sf ~/repos/black-atom-industries/ghostty/themes/stations/black-atom-stations-operations.conf ~/.config/ghostty/themes/
ln -sf ~/repos/black-atom-industries/ghostty/themes/stations/black-atom-stations-medical.conf ~/.config/ghostty/themes/
ln -sf ~/repos/black-atom-industries/ghostty/themes/stations/black-atom-stations-research.conf ~/.config/ghostty/themes/

# And so on for Default, Terra, and MNML collections...
```

With symlinks in place, your workflow becomes:

1. Make changes to templates
2. Run `deno task generate`
3. Reload Ghostty to see changes immediately

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
- [Black Atom for Obsidian](https://github.com/black-atom-industries/obsidian) - Obsidian adapter
