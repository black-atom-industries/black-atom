# Black Atom for Zed

> A collection of elegant, cohesive themes for the Zed editor by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Zed adapter** for Black Atom. Themes are defined once in
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

- [Zed](https://zed.dev/) editor

### Install the theme files

Generate the theme files (requires [Deno](https://deno.land/)) and copy the `.json` files to your
Zed themes directory:

```bash
deno task generate
mkdir -p ~/.config/zed/themes
cp themes/*/*.json ~/.config/zed/themes/
```

## Usage

### Applying Themes in Zed

1. Open Zed
2. Go to `Settings` > `Themes`
3. Select any Black Atom theme from the list
4. Click `Apply Theme`

Alternatively, you can edit your Zed settings JSON file directly:

```json
{
    "theme": "black-atom-jpn-koyo-yoru"
}
```

## Development

Requirements: [Deno](https://deno.land/).

```bash
deno task generate  # regenerate theme files
deno task dev        # watch mode
```

### Theme Format

Zed themes are JSON files that define syntax highlighting and UI colors. Black Atom themes follow Zed's theme schema, defining:

- UI elements colors
- Syntax highlighting colors
- Terminal colors

### Template Structure

Templates use the Eta template engine syntax to inject theme values from the Black Atom core
definitions:

```json
{
  "name": "Black Atom JPN Koyo Hiru",
  "author": "Black Atom Industries",
  "themes": [
    {
      "name": "Black Atom JPN Koyo Hiru",
      "appearance": "light",
      "style": {
        "background": <%= theme.ui.bg.default %>,
        "foreground": <%= theme.ui.fg.default %>,
        // ...and so on
      }
    }
  ]
}
```

Templates live at `themes/<collection>/collection.template.json`. Add a new template to
`black-atom-adapter.json` before generating.

## License

MIT - See [LICENSE](./LICENSE.md) for details
