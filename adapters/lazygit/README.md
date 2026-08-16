# Black Atom for Lazygit

> A collection of elegant, cohesive themes for Lazygit by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **Lazygit adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

- The [core repository](https://github.com/black-atom-industries/core) is the single source of truth for all theme definitions
- Each adapter implements these themes for a specific platform (Neovim, Ghostty, Lazygit, etc.)
- The adapter uses templates to transform core theme definitions into platform-specific files

This modular approach ensures consistent colors and styling across all supported platforms while allowing for platform-specific optimizations.

## Available Themes

Black Atom includes multiple theme collections, each with its own distinct style:

| Collection    | Themes                                                     | Description                   |
| ------------- | ---------------------------------------------------------- | ----------------------------- |
| **Default**   | dark, dark-dimmed, light, light-dimmed                     | Core Black Atom themes        |
| **JPN**       | koyo-hiru, koyo-yoru, tsuki-yoru, murasaki-yoru            | Japanese-inspired themes      |
| **Stations**  | engineering, operations, medical, research                 | Space station-inspired themes |
| **Terra**     | seasons (spring, summer, fall, winter) × time (day, night) | Earth season-inspired themes  |
| **MNML**      | clay, orange, osman, mikado, 47, eink (dark/light)         | Minimalist themes             |

## Installation

### Prerequisites

- [Lazygit](https://github.com/jesseduffield/lazygit)

### Finding Your Config Directory

Lazygit respects XDG on macOS and Linux, and uses AppData on Windows:

- **Linux**: `~/.config/lazygit/config.yml`
- **macOS**: `~/Library/Application Support/lazygit/config.yml`
- **Windows**: `%APPDATA%\lazygit\config.yml`

To find your actual config directory:

```bash
lazygit --print-config-dir
```

### Download Themes

Clone this repository to get all pre-generated theme files:

```bash
git clone https://github.com/black-atom-industries/lazygit.git
```

The theme files are located in `themes/{collection}/{theme-name}.yml` and are ready to use.

## Usage

There are two ways to apply Black Atom themes to Lazygit:

### Method 1: Merge into Config (Recommended)

The simplest approach is to merge the theme directly into your `config.yml`. You can use [yq](https://github.com/mikefarah/yq) to do this programmatically:

```bash
# Choose your theme file
THEME_FILE="themes/jpn/black-atom-jpn-koyo-yoru.yml"

# Merge the theme into your config
yq -i ".gui.theme = load(\"$THEME_FILE\").gui.theme" ~/.config/lazygit/config.yml
yq -i ".gui.authorColors = load(\"$THEME_FILE\").gui.authorColors" ~/.config/lazygit/config.yml
```

Or manually copy the theme block into your config:

<details>
<summary>Example: Black Atom — JPN ∷ Koyo Yoru</summary>

```yaml
gui:
  theme:
    activeBorderColor:
      - "#edaa4b"
      - bold
    inactiveBorderColor:
      - "#9c98b3"
    optionsTextColor:
      - "#a298b9"
    selectedLineBgColor:
      - "#4d4053"
    cherryPickedCommitBgColor:
      - "#413446"
    cherryPickedCommitFgColor:
      - "#edaa4b"
    unstagedChangesColor:
      - "#e47889"
    defaultFgColor:
      - "#fbcaa4"
    searchingActiveBorderColor:
      - "#edaa4b"

  authorColors:
    "*": "#eda77d"
```

</details>

### Method 2: Use Config File Flag

Lazygit supports merging multiple config files at startup:

1. Copy your chosen theme file to your config directory:

```bash
cp themes/jpn/black-atom-jpn-koyo-yoru.yml ~/.config/lazygit/
```

2. Launch lazygit with the merged configs:

```bash
lazygit --use-config-file="~/.config/lazygit/config.yml,~/.config/lazygit/black-atom-jpn-koyo-yoru.yml"
```

Or set an environment variable:

```bash
export LG_CONFIG_FILE="~/.config/lazygit/config.yml,~/.config/lazygit/black-atom-jpn-koyo-yoru.yml"
lazygit
```

You can add this to your shell profile for permanent use.

## FAQ

**Q: Why is my background color wrong?**

A: Lazygit uses your terminal's background color. Make sure your terminal theme matches your Lazygit theme. Black Atom provides matching themes for [Ghostty](https://github.com/black-atom-industries/ghostty), [WezTerm](https://github.com/black-atom-industries/wezterm), and other terminals.

**Q: The colors don't look right in tmux?**

A: Ensure your tmux supports true color. Add this to your `tmux.conf`:

```bash
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",*:RGB"
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

### Template Structure

Templates use the Eta template engine syntax to inject theme values:

```yaml
gui:
  theme:
    activeBorderColor:
      - "<%= theme.ui.fg.accent %>"
      - bold
    inactiveBorderColor:
      - "<%= theme.ui.fg.subtle %>"
    # ...and so on
```

### Regenerating Themes

To regenerate all themes from templates:

```bash
deno task generate
```

### Development with Symlinks

For active development, symlink the theme files to your config directory:

```bash
mkdir -p ~/.config/lazygit/themes
ln -sf ~/repos/black-atom-industries/lazygit/themes/*/*.yml ~/.config/lazygit/themes/
```

Then use yq to switch themes:

```bash
THEME_FILE="~/.config/lazygit/themes/black-atom-jpn-koyo-yoru.yml"
yq -i ".gui.theme = load(\"$THEME_FILE\").gui.theme" ~/.config/lazygit/config.yml
```

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
- [Black Atom for Ghostty](https://github.com/black-atom-industries/ghostty) - Ghostty adapter
- [Black Atom for tmux](https://github.com/black-atom-industries/tmux) - tmux adapter
- [Black Atom for Zed](https://github.com/black-atom-industries/zed) - Zed editor adapter
