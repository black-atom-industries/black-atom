# Black Atom for Niri

> A collection of elegant, cohesive themes for the Niri Wayland compositor by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Niri adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

## Installation

### Prerequisites

- [Niri](https://github.com/YaLTeR/niri) Wayland compositor (v25.11+ for include support)

## Usage

Niri supports the `include` directive (since v25.11) which allows you to split configuration into
multiple files. Black Atom themes are designed to work with this feature.

### Method 1: Direct Include

Include a theme file directly in your niri config:

```kdl
// In your ~/.config/niri/config.kdl
include "/path/to/black-atom/adapters/niri/themes/terra/black-atom-terra-fall-dark.kdl"
```

### Method 2: Symlink (Recommended for Theme Switching)

Create a symlink that you can update to switch themes:

```bash
# Create initial symlink
ln -sf /path/to/black-atom/adapters/niri/themes/terra/black-atom-terra-fall-dark.kdl ~/.config/niri/theme.kdl
```

Then include it in your config:

```kdl
// In your ~/.config/niri/config.kdl
include "theme.kdl"
```

To switch themes, just update the symlink:

```bash
ln -sf /path/to/black-atom/adapters/niri/themes/jpn/black-atom-jpn-koyo-dark.kdl ~/.config/niri/theme.kdl
```

Niri will automatically reload the configuration when the included file changes.

### What the Theme Controls

Each theme file configures the following niri elements:

- **Overview**: backdrop color, workspace shadow
- **Focus Ring**: active and inactive colors
- **Border**: active, inactive, and urgent colors
- **Window Shadow**: shadow color

## Development

Requirements: [Node.js](https://nodejs.org/) 24+.

```bash
node ../../core/src/cli/index.ts generate  # regenerate theme files
node ../../core/src/cli/index.ts generate --watch        # watch mode
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

Templates live at `themes/<collection>/collection.template.kdl`.

## Roadmap

See [beads issues](.beads/) for tracked work:

- `niri-f1q` - Experiment with gradient support
- `niri-3ng` - Differentiate active/focus vs inactive border colors

## License

MIT - See [LICENSE](./LICENSE) for details
