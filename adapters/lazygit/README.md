# Black Atom for Lazygit

> A collection of elegant, cohesive themes for Lazygit by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Lazygit adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

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

### Theme files

The generated theme files live at `themes/<collection>/<theme-name>.yml` in this adapter, ready
to use.

## Usage

There are two ways to apply Black Atom themes to Lazygit:

### Method 1: Merge into Config (Recommended)

The simplest approach is to merge the theme directly into your `config.yml`. You can use [yq](https://github.com/mikefarah/yq) to do this programmatically:

```bash
# Choose your theme file
THEME_FILE="themes/jpn/black-atom-jpn-koyo-dark.yml"

# Merge the theme into your config
yq -i ".gui.theme = load(\"$THEME_FILE\").gui.theme" ~/.config/lazygit/config.yml
yq -i ".gui.authorColors = load(\"$THEME_FILE\").gui.authorColors" ~/.config/lazygit/config.yml
```

Or manually copy the theme block into your config:

<details>
<summary>Example: Black Atom — JPN ∷ Koyo Dark</summary>

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
cp themes/jpn/black-atom-jpn-koyo-dark.yml ~/.config/lazygit/
```

2. Launch lazygit with the merged configs:

```bash
lazygit --use-config-file="~/.config/lazygit/config.yml,~/.config/lazygit/black-atom-jpn-koyo-dark.yml"
```

Or set an environment variable:

```bash
export LG_CONFIG_FILE="~/.config/lazygit/config.yml,~/.config/lazygit/black-atom-jpn-koyo-dark.yml"
lazygit
```

You can add this to your shell profile for permanent use.

## FAQ

**Q: Why is my background color wrong?**

A: Lazygit uses your terminal's background color. Make sure your terminal theme matches your
Lazygit theme. Black Atom provides matching themes for [Ghostty](../ghostty/README.md),
[WezTerm](../wezterm/README.md), and other terminals.

**Q: The colors don't look right in tmux?**

A: Ensure your tmux supports true color. Add this to your `tmux.conf`:

```bash
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",*:RGB"
```

## Development

Requirements: [Deno](https://deno.land/).

```bash
deno run -A ../../core/src/cli/index.ts generate  # regenerate theme files
deno run -A ../../core/src/cli/index.ts generate --watch        # watch mode
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

Templates live at `themes/<collection>/collection.template.yml`.

## License

MIT
