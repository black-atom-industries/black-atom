# Black Atom tmux Themes

Beautiful tmux color schemes from the Black Atom Industries theme collection.

## Installation

Generate the theme files (requires [Node.js](https://nodejs.org/) 24+):

```bash
node ../../core/src/cli/index.ts generate
```

Then source your preferred theme in your `~/.tmux.conf`:

```bash
source-file /path/to/black-atom/adapters/tmux/themes/clay/black-atom-clay-dark.conf
```

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

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
- **Clay**, **Minium**, **Mono**: Minimal contrast, subtle indicators
- **Facility**: Bold, technical appearance
- **Terra**: Natural, seasonal variations

## Development

Theme files are generated from templates through the Black Atom core CLI. To modify themes:

1. Edit the appropriate template file in `themes/*/collection.template.conf`
2. Run `node ../../core/src/cli/index.ts generate` to regenerate theme files (or `node ../../core/src/cli/index.ts generate --watch` for watch mode)
3. Test the changes in tmux

## License

MIT License - see [LICENSE](LICENSE) file for details.
