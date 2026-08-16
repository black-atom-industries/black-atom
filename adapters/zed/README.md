# Black Atom for Zed

> A collection of elegant, cohesive themes for the Zed editor by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **Zed adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

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

- [Zed](https://zed.dev/) editor
- [Deno](https://deno.land/) runtime (for generating themes)

### Setup

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/zed.git
cd zed
```

2. Generate the theme files:

```bash
deno task generate
```

3. Copy the adapted `.json` files to your Zed themes directory:

```bash
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

### Theme Installation

For Zed to find themes by name, they must be placed in the Zed themes directory:

```bash
# Create the themes directory if it doesn't exist
mkdir -p ~/.config/zed/themes

# Copy the generated theme files
cp themes/*/*.json ~/.config/zed/themes/
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

Zed themes are JSON files that define syntax highlighting and UI colors. Black Atom themes follow Zed's theme schema, defining:

- UI elements colors
- Syntax highlighting colors
- Terminal colors

### Template Structure

Our templates use the Eta template engine syntax to inject theme values from the Black Atom core definitions:

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

### Creating New Templates

To create a new template:

1. Create a `.template.json` file in the appropriate collection directory
2. Use template variables to reference color values from the core definitions
3. Add the template to `black-atom-adapter.json`
4. Adapt the theme using the core CLI

### Adapting Themes

To adapt all themes from the templates:

```bash
deno task generate
```

This will process all template files defined in `black-atom-adapter.json` and create the corresponding `.json` files.

### Development with Symlinks

For theme development, it's more efficient to use symlinks rather than copying files. This allows you to see changes immediately after adapting new theme files without having to copy them again:

```bash
# Create the Zed themes directory if it doesn't exist
mkdir -p ~/.config/zed/themes

# Change to the themes directory and create relative symlinks
cd ~/.config/zed/themes
find ~/repos/black-atom-industries/zed/themes -name "*.json" -type f | while read -r theme; do
    ln -sf "../../../repos/black-atom-industries/zed/themes/${theme#*/zed/themes/}" .
done
```

Alternatively, you can create symlinks for specific collections:

```bash
# Change to the themes directory first
cd ~/.config/zed/themes

# JPN Collection
ln -sf ../../../repos/black-atom-industries/zed/themes/jpn/black-atom-jpn-koyo-hiru.json .
ln -sf ../../../repos/black-atom-industries/zed/themes/jpn/black-atom-jpn-koyo-yoru.json .
ln -sf ../../../repos/black-atom-industries/zed/themes/jpn/black-atom-jpn-tsuki-yoru.json .

# Stations Collection
ln -sf ../../../repos/black-atom-industries/zed/themes/stations/black-atom-stations-engineering.json .
ln -sf ../../../repos/black-atom-industries/zed/themes/stations/black-atom-stations-operations.json .
ln -sf ../../../repos/black-atom-industries/zed/themes/stations/black-atom-stations-medical.json .
ln -sf ../../../repos/black-atom-industries/zed/themes/stations/black-atom-stations-research.json .

# And symlinks for Default, Terra, and MNML collections would follow the same pattern...
```

With symlinks in place, your workflow becomes:

1. Make changes to templates
2. Run `deno task generate`
3. Restart Zed or reload themes to see changes immediately

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
- [Black Atom for Ghostty](https://github.com/black-atom-industries/ghostty) - Ghostty terminal adapter
- [Black Atom for Obsidian](https://github.com/black-atom-industries/obsidian) - Obsidian adapter
