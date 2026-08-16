# Black Atom for Obsidian

A theme for [Obsidian](https://obsidian.md/) by
[Black Atom Industries](https://github.com/black-atom-industries).

## Available Themes

| Collection  | Variants                               |
| ----------- | -------------------------------------- |
| **Default** | Dark, Dark Dimmed, Light, Light Dimmed |

## Installation

Copy `theme.css` and `manifest.json` into your vault's theme directory:

```bash
mkdir -p /path/to/vault/.obsidian/themes/Black-Atom
cp theme.css manifest.json /path/to/vault/.obsidian/themes/Black-Atom/
```

Then in Obsidian: **Settings > Appearance > Theme > Black Atom**.

## Configuration

The theme works out of the box with the **Default Dark** and **Default Light**
variants.

To switch between all available theme variants, install the
[Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin
(recommended):

**Settings > Style Settings > Black Atom :: Variants**

## Development

This adapter uses a pure CSS template approach.
[Black Atom Core](https://jsr.io/@black-atom/core) processes Eta templates to
generate per-theme CSS, and a build script assembles them into `theme.css`. You
need [Deno](https://deno.land/) installed.

```bash
git clone https://github.com/black-atom-industries/obsidian.git
cd obsidian
```

Edit templates in `themes/`, then build:

```bash
deno task build
```

For live development, set your vault path in `.env` (see `.env.example`) and run
watch mode. This copies the theme into your vault as **Black Atom Development**
on every rebuild:

```bash
cp .env.example .env
# Edit .env with your vault path
deno task dev
```

## Related Projects

- [Black Atom Core](https://github.com/black-atom-industries/core) -- Core theme
  definitions
- [Black Atom for Neovim](https://github.com/black-atom-industries/nvim) --
  Neovim adapter
- [Black Atom for Ghostty](https://github.com/black-atom-industries/ghostty) --
  Ghostty terminal adapter
- [Black Atom for Zed](https://github.com/black-atom-industries/zed) -- Zed
  editor adapter

## License

MIT
