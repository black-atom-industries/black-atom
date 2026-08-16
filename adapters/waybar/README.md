# Black Atom for Waybar

> Elegant, cohesive color themes for Waybar by Black Atom Industries

## What is a Black Atom Adapter?

This repository is a **Waybar adapter** for the Black Atom theme ecosystem. In the Black Atom architecture:

- The [core repository](https://github.com/black-atom-industries/core) is the single source of truth for all theme definitions
- Each adapter implements these themes for a specific platform (Waybar, Neovim, terminals, etc.)
- The adapter uses templates to transform core theme definitions into platform-specific files

## How It Works

This adapter generates CSS files containing GTK color definitions using `@define-color`. You import a theme file and use the color variables in your own `style.css`.

### Available Colors

```css
/* Background colors */
@ba-bg-default    /* Main background */
@ba-bg-panel      /* Panel/secondary background */
@ba-bg-hover      /* Hover state */
@ba-bg-active     /* Active/pressed state */
@ba-bg-selection  /* Selection background */
@ba-bg-contrast   /* High contrast background */

/* Foreground colors */
@ba-fg-default    /* Main text */
@ba-fg-subtle     /* Subtle/secondary text */
@ba-fg-accent     /* Accent color */
@ba-fg-disabled   /* Disabled text */
@ba-fg-contrast   /* High contrast text */

/* Feedback colors */
@ba-fg-negative   /* Error/negative */
@ba-fg-positive   /* Success/positive */
@ba-fg-warn       /* Warning */
@ba-fg-info       /* Info */

/* Palette colors */
@ba-red, @ba-green, @ba-yellow, @ba-blue, @ba-magenta, @ba-cyan
```

## Installation

### Prerequisites

- Waybar
- [Deno](https://deno.land/) runtime (for generating themes)

### Setup

1. Clone this repository:

```bash
git clone https://github.com/black-atom-industries/waybar.git
cd waybar
```

2. Generate theme files (requires [Deno](https://deno.land/)):

```bash
deno task generate
```

3. Import a theme in your `style.css`:

```css
@import "path/to/themes/black-atom-jpn-koyo-yoru.css";

window#waybar {
    background-color: @ba-bg-default;
    color: @ba-fg-default;
}

#workspaces button {
    color: @ba-fg-subtle;
}

#workspaces button.focused {
    background: @ba-fg-default;
    color: @ba-bg-default;
}

#workspaces button:hover {
    background: @ba-bg-hover;
}
```

## Available Themes

| Collection   | Description                  | Themes    |
| ------------ | ---------------------------- | --------- |
| **Default**  | Core Black Atom themes       | 4 themes  |
| **JPN**      | Japanese-inspired themes     | 4 themes  |
| **MNML**     | Minimal themes               | 11 themes |
| **Stations** | Space station-inspired       | 4 themes  |
| **Terra**    | Earth seasons-inspired       | 8 themes  |

## Development

### Repository Structure

```
.
├── LICENSE
├── README.md
├── black-atom-adapter.json
└── themes/
    ├── collection.template.css     # Single template for all themes
    ├── black-atom-jpn-koyo-yoru.css
    ├── black-atom-mnml-clay-dark.css
    └── ...                         # 31 generated theme files
```

## License

MIT © Black Atom Industries
