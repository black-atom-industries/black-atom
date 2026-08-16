# Black Atom for Waybar

> Elegant, cohesive color themes for Waybar by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Waybar adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## How It Works

This adapter generates CSS files containing GTK color definitions using `@define-color`. You import a theme file and use the color variables in your own `style.css`.

### Available Colors

```css
/* Background colors */
@ba-bg-default /* Main background */
    @ba-bg-panel /* Panel/secondary background */
    @ba-bg-hover /* Hover state */
    @ba-bg-active /* Active/pressed state */
    @ba-bg-selection /* Selection background */
    @ba-bg-contrast /* High contrast background */
    /* Foreground colors */
    @ba-fg-default /* Main text */
    @ba-fg-subtle /* Subtle/secondary text */
    @ba-fg-accent /* Accent color */
    @ba-fg-disabled /* Disabled text */
    @ba-fg-contrast /* High contrast text */
    /* Feedback colors */
    @ba-fg-negative /* Error/negative */
    @ba-fg-positive /* Success/positive */
    @ba-fg-warn /* Warning */
    @ba-fg-info /* Info */
    /* Palette colors */
    @ba-red, @ba-green, @ba-yellow, @ba-blue, @ba-magenta, @ba-cyan
```

## Installation

### Prerequisites

- Waybar

### Setup

Generate the theme files (requires [Deno](https://deno.land/)):

```bash
deno task generate
```

Import a theme in your `style.css`:

```css
@import "path/to/themes/jpn/black-atom-jpn-koyo-yoru.css";

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

| Collection   | Description              | Themes    |
| ------------ | ------------------------ | --------- |
| **Default**  | Core Black Atom themes   | 4 themes  |
| **JPN**      | Japanese-inspired themes | 4 themes  |
| **MNML**     | Minimal themes           | 14 themes |
| **Paper**    | Paper-inspired themes    | 4 themes  |
| **Stations** | Space station-inspired   | 4 themes  |
| **Terra**    | Earth seasons-inspired   | 8 themes  |

## Development

```bash
deno task generate  # regenerate theme files
deno task dev        # watch mode
```

### Layout

```
.
├── LICENSE
├── README.md
├── black-atom-adapter.json
└── themes/
    ├── collection.template.css     # single template for all collections
    ├── default/black-atom-default-dark.css
    ├── jpn/black-atom-jpn-koyo-yoru.css
    └── ...                         # one directory per collection
```

## License

MIT © Black Atom Industries
