# Black Atom for Obsidian

A theme for [Obsidian](https://obsidian.md/) by Black Atom Industries. Black Atom ships as one
Obsidian theme; five collections switch as variants within it.

## Available Themes

| Collection   | Variants                                                              |
| ------------ | --------------------------------------------------------------------- |
| **Default**  | Dark, Dark Dimmed, Light, Light Dimmed                                |
| **JPN**      | Koyo Hiru, Koyo Yoru, Tsuki Yoru, Murasaki Yoru                       |
| **MNML**     | Clay, Orange, Mikado, 47, Eink, Mono (Dark/Light), Osman, Ita (Light) |
| **Stations** | Engineering, Operations, Medical, Research                            |
| **Terra**    | Spring, Summer, Fall, Winter (Day/Night)                              |

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
need [Deno](https://deno.land/) installed.

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

## License

MIT
