# Black Atom for Obsidian

A theme for [Obsidian](https://obsidian.md/) by Black Atom Industries. Black Atom ships as one
Obsidian theme, and every Black Atom theme switches as a variant within it.

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

## Installation

Copy `theme.css` and `manifest.json` into your vault's theme directory:

```bash
mkdir -p "/path/to/vault/.obsidian/themes/Black Atom"
cp theme.css manifest.json "/path/to/vault/.obsidian/themes/Black Atom/"
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

This adapter uses a pure CSS template approach. Black Atom's core processes Eta templates to
generate per-theme CSS, and a build script assembles them into `theme.css`. You
need [Node.js](https://nodejs.org/) 24+ installed.

Edit templates in `themes/` or styles in `styles/`, then run `npm run dev` from the repository
root. The shared watcher generates adapter files and assembles `theme.css`.

To copy each successful rebuild into a development vault, set `OBSIDIAN_DEV_VAULT` in the environment
or in `adapters/obsidian/.env` (see `.env.example`). Copying is opt-in and uses the theme name
**Black Atom Development**.

For a one-off generation of all adapters, including Obsidian assembly, from this directory:

```bash
node ../../core/src/tasks/generate.ts
```

## License

MIT
