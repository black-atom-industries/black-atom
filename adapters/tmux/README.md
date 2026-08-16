# Black Atom tmux Themes

Beautiful tmux color schemes from the Black Atom Industries theme collection.

## Installation

### Using Deno

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/tmux.git
cd tmux
```

2. Generate theme files (requires [Deno](https://deno.land/)):

```bash
deno task generate
```

This will generate all theme files from the templates.

### Manual Installation

After generating the theme files, source your preferred theme in your `~/.tmux.conf`:

```bash
# Example: Using the MNML Clay Dark theme
source-file ~/.config/tmux/themes/black-atom-mnml-clay-dark.conf
```

Or if you cloned to a different location:

```bash
source-file ~/path/to/black-atom-industries/tmux/themes/mnml/black-atom-mnml-clay-dark.conf
```

## Available Themes

### JPN Collection (Japanese-inspired)
- `black-atom-jpn-koyo-yoru` - Autumn evening theme (dark)
- `black-atom-jpn-koyo-hiru` - Autumn daytime theme (light)
- `black-atom-jpn-tsuki-yoru` - Moonlit night theme (dark)
- `black-atom-jpn-murasaki-yoru` - Purple night theme (dark)

### MNML Collection (Minimal)
- `black-atom-mnml-clay-dark` - Clay dark
- `black-atom-mnml-clay-light` - Clay light
- `black-atom-mnml-orange-dark` - Orange accent dark
- `black-atom-mnml-orange-light` - Orange accent light
- `black-atom-mnml-blue-dark` - Blue accent dark
- `black-atom-mnml-blue-light` - Blue accent light
- `black-atom-mnml-47-dark` - Special variant dark
- `black-atom-mnml-47-light` - Special variant light

### Stations Collection (Space station-inspired)
- `black-atom-stations-engineering` - Engineering station (dark)
- `black-atom-stations-operations` - Operations station (dark)
- `black-atom-stations-medical` - Medical station (light)
- `black-atom-stations-research` - Research station (light)

### Terra Collection (Earth seasons-inspired)
- `black-atom-terra-spring-day` - Spring daytime (light)
- `black-atom-terra-spring-night` - Spring evening (dark)
- `black-atom-terra-summer-day` - Summer daytime (light)
- `black-atom-terra-summer-night` - Summer evening (dark)
- `black-atom-terra-fall-day` - Fall daytime (light)
- `black-atom-terra-fall-night` - Fall evening (dark)
- `black-atom-terra-winter-day` - Winter daytime (light)
- `black-atom-terra-winter-night` - Winter evening (dark)

### North Collection (Nordic-inspired)
- `black-atom-north-night` - Nordic night (dark)
- `black-atom-north-dark-night` - Deep Nordic night (dark)
- `black-atom-north-day` - Nordic day (light)

## What Gets Themed

The Black Atom tmux themes customize the following elements:

- **Status bar**: Background, foreground, left and right sections
- **Window status**: Active, inactive, activity, and bell states
- **Pane borders**: Active and inactive pane borders
- **Session switcher**: Selection highlighting (mode-style)
- **Messages**: Command messages and prompts
- **Display panes**: Pane number indicators (prefix + q)

## Requirements

- tmux 3.2 or newer (for full feature support)
- A terminal emulator with 256-color or true color support

## Customization

Each collection has its own styling philosophy:

- **JPN**: Balanced with unique accent colors
- **MNML**: Minimal contrast, subtle indicators
- **Stations**: Bold, technical appearance
- **Terra**: Natural, seasonal variations
- **North**: Nordic minimalism with frost-inspired accents

## Development

This repository uses the Black Atom adapter pattern. Theme files are generated from templates using [Black Atom Core](https://jsr.io/@black-atom/core). To modify themes:

1. Edit the appropriate template file in `themes/*/collection.template.conf`
2. Run `deno task generate` to regenerate theme files (or `deno task dev` for watch mode)
3. Test the changes in tmux

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Created by [Black Atom Industries](https://github.com/black-atom-industries)