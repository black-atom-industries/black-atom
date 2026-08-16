# Black Atom for Niri

> A collection of elegant, cohesive themes for the Niri Wayland compositor by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **Niri adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

- The [core repository](https://github.com/black-atom-industries/core) is the single source of truth for all theme definitions
- Each adapter implements these themes for a specific platform (Neovim, Ghostty, Niri, etc.)
- The adapter uses templates to transform core theme definitions into platform-specific files

This modular approach ensures consistent colors and styling across all supported platforms while allowing for platform-specific optimizations.

## Available Themes

Black Atom includes multiple theme collections, each with its own distinct style:

| Collection   | Themes                                                     | Description                   |
| ------------ | ---------------------------------------------------------- | ----------------------------- |
| **Default**  | dark, dark-dimmed, light, light-dimmed                     | Core Black Atom themes        |
| **JPN**      | koyo-hiru, koyo-yoru, tsuki-yoru, murasaki-yoru            | Japanese-inspired themes      |
| **Stations** | engineering, operations, medical, research                 | Space station-inspired themes |
| **Terra**    | seasons (spring, summer, fall, winter) x time (day, night) | Earth season-inspired themes  |
| **MNML**     | clay, orange, osman, mikado, 47, eink                      | Minimalist themes             |

## Installation

### Prerequisites

- [Niri](https://github.com/YaLTeR/niri) Wayland compositor (v25.11+ for include support)
- [Deno](https://deno.land/) runtime (for generating themes)

### Setup

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/niri.git ~/repos/black-atom-industries/niri
cd ~/repos/black-atom-industries/niri
```

2. Generate the theme files:

```bash
deno task generate
```

## Usage

Niri supports the `include` directive (since v25.11) which allows you to split configuration into multiple files. Black Atom themes are designed to work with this feature.

### Method 1: Direct Include

Include a theme file directly in your niri config:

```kdl
// In your ~/.config/niri/config.kdl
include "path/to/black-atom-industries/niri/themes/terra/black-atom-terra-fall-night.kdl"
```

### Method 2: Symlink (Recommended for Theme Switching)

Create a symlink that you can update to switch themes:

```bash
# Create initial symlink
ln -sf ~/repos/black-atom-industries/niri/themes/terra/black-atom-terra-fall-night.kdl ~/.config/niri/theme.kdl
```

Then include it in your config:

```kdl
// In your ~/.config/niri/config.kdl
include "theme.kdl"
```

To switch themes, just update the symlink:

```bash
ln -sf ~/repos/black-atom-industries/niri/themes/jpn/black-atom-jpn-koyo-yoru.kdl ~/.config/niri/theme.kdl
```

Niri will automatically reload the configuration when the included file changes.

### What the Theme Controls

Each theme file configures the following niri elements:

- **Overview**: backdrop color, workspace shadow
- **Focus Ring**: active and inactive colors
- **Border**: active, inactive, and urgent colors
- **Window Shadow**: shadow color

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

Niri themes are partial KDL configuration files that set visual properties:

```kdl
overview {
    backdrop-color "#1a1b26"
    workspace-shadow {
        color "#1a1b2650"
    }
}

layout {
    focus-ring {
        active-color "#e3bc13"
        inactive-color "#505050"
    }
    border {
        active-color "#e3bc13"
        inactive-color "#505050"
        urgent-color "#ff5555"
    }
    shadow {
        color "#1a1b2670"
    }
}
```

### Template Structure

Templates use the Eta template engine syntax to inject theme values:

```kdl
overview {
    backdrop-color "<%= theme.ui.bg.default %>"
}

layout {
    focus-ring {
        active-color "<%= theme.ui.fg.accent %>"
        inactive-color "<%= theme.ui.fg.subtle %>"
    }
}
```

### Regenerating Themes

To regenerate all themes from templates:

```bash
deno task generate
```

## Roadmap

See [beads issues](.beads/) for tracked work:
- `niri-f1q` - Experiment with gradient support
- `niri-3ng` - Differentiate active/focus vs inactive border colors

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
- [Black Atom for Zed](https://github.com/black-atom-industries/zed) - Zed editor adapter
