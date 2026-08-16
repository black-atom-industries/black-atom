# Black Atom for Ghostty

> A collection of elegant, cohesive themes for the Ghostty terminal by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Ghostty adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## Available Themes

Black Atom includes multiple theme collections, each with dark and light variants:

| Collection   | Description                   |
| ------------ | ----------------------------- |
| **Default**  | Core Black Atom themes        |
| **JPN**      | Japanese-inspired themes      |
| **MNML**     | Minimalist accent themes      |
| **Stations** | Space station-inspired themes |
| **Terra**    | Earth season-inspired themes  |

## Installation

### Prerequisites

- [Ghostty](https://github.com/mitchellh/ghostty) terminal emulator

### Install the theme files

Copy the generated `.conf` files to your Ghostty themes directory:

```bash
mkdir -p ~/.config/ghostty/themes
cp themes/*/*.conf ~/.config/ghostty/themes/
```

Or apply themes through [Livery](../../livery/README.md), which manages this directory for you:
`livery apply <theme>`.

## Usage

Ghostty supports various ways to use themes. Below are the recommended methods for using Black
Atom themes with Ghostty.

### Method 1: Using the `theme` Configuration Option

After installing the themes to your Ghostty themes directory, you can use the built-in `theme`
option:

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

### Listing Available Themes

To see all available themes including the Black Atom themes:

```bash
ghostty +list-themes
```

## Development

Requirements: [Deno](https://deno.land/).

```bash
deno task generate  # regenerate theme files
deno task dev        # watch mode
```

### Theme Format

Ghostty themes are simple configuration files that set color options. Black Atom themes define the
following properties:

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

Templates use the Eta template engine syntax to inject theme values from the Black Atom core
definitions:

```ini
background = <%= theme.ui.bg.default %>
foreground = <%= theme.ui.fg.default %>
cursor-color = <%= theme.ui.fg.accent %>
# ...and so on
```

Templates live at `themes/<collection>/collection.template.conf`. Add a new template to
`black-atom-adapter.json` before generating.

## License

MIT - See [LICENSE](./LICENSE) for details
