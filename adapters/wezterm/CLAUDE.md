# Black Atom WezTerm Adapter

This document contains useful information for Claude to help with the Black Atom WezTerm adapter.

## Directory Structure

```
wezterm/
├── LICENSE                           # MIT License file
├── README.md                         # Documentation for users
├── black-atom-adapter.json           # Adapter configuration
└── themes/                           # Theme template files
    ├── crbn/                         # CRBN collection templates
    │   ├── black-atom-crbn-null.template.toml
    │   └── black-atom-crbn-supr.template.toml
    ├── jpn/                          # JPN collection templates
    │   ├── black-atom-jpn-koyo-hiru.template.toml
    │   ├── black-atom-jpn-koyo-yoru.template.toml
    │   └── black-atom-jpn-tsuki-yoru.template.toml
    ├── stations/                     # Stations collection templates
    │   ├── black-atom-stations-engineering.template.toml
    │   ├── black-atom-stations-medical.template.toml
    │   ├── black-atom-stations-operations.template.toml
    │   └── black-atom-stations-research.template.toml
    └── terra/                        # Terra collection templates
        ├── black-atom-terra-fall-day.template.toml
        ├── black-atom-terra-fall-night.template.toml
        └── ... other Terra templates
```

## Template Format

WezTerm themes use TOML format. Here's the structure with correct token mappings:

```toml
[metadata]
author = "Black Atom Industries"
name = "<%= theme.meta.label %>"

[colors]
foreground = "<%= theme.ui.fg.default %>"
background = "<%= theme.ui.bg.default %>"
cursor_bg = "<%= theme.ui.fg.accent %>"
cursor_border = "<%= theme.ui.fg.accent %>"
cursor_fg = "<%= theme.ui.bg.default %>"
selection_bg = "<%= theme.ui.bg.selection %>"
selection_fg = "<%= theme.ui.fg.default %>"
split = "<%= theme.ui.fg.accent %>"
compose_cursor = "<%= theme.ui.fg.negative %>"
scrollbar_thumb = "<%= theme.ui.fg.subtle %>"

ansi = [
  "<%= theme.palette.black %>", # black
  "<%= theme.palette.darkRed %>", # dark_red
  "<%= theme.palette.darkGreen %>", # dark_green
  "<%= theme.palette.darkYellow %>", # dark_yellow
  "<%= theme.palette.darkBlue %>", # dark_blue
  "<%= theme.palette.darkMagenta %>", # dark_magenta
  "<%= theme.palette.darkCyan %>", # dark_cyan
  "<%= theme.palette.lightGray %>" # light_gray
]

brights = [
  "<%= theme.palette.gray %>", # gray
  "<%= theme.palette.red %>", # red
  "<%= theme.palette.green %>", # green
  "<%= theme.palette.yellow %>", # yellow
  "<%= theme.palette.blue %>", # blue
  "<%= theme.palette.magenta %>", # magenta
  "<%= theme.palette.cyan %>", # cyan
  "<%= theme.palette.white %>" # white
]

[colors.tab_bar]
inactive_tab_edge = "<%= theme.ui.bg.panel %>"
background = "<%= theme.ui.bg.panel %>"

[colors.tab_bar.active_tab]
fg_color = "<%= theme.ui.fg.contrast %>"
bg_color = "<%= theme.ui.fg.accent %>"
intensity = "Bold"

[colors.tab_bar.inactive_tab]
fg_color = "<%= theme.ui.fg.contrast %>"
bg_color = "<%= theme.ui.bg.disabled %>"

[colors.tab_bar.inactive_tab_hover]
fg_color = "<%= theme.ui.fg.contrast %>"
bg_color = "<%= theme.ui.bg.hover %>"

[colors.tab_bar.new_tab_hover]
fg_color = "<%= theme.ui.fg.contrast %>"
bg_color = "<%= theme.ui.bg.hover %>"
intensity = "Bold"

[colors.tab_bar.new_tab]
fg_color = "<%= theme.ui.fg.contrast %>"
bg_color = "<%= theme.ui.fg.positive %>"
```

## Black Atom Theme Components

### Meta
- `theme.meta.label` - The display name of the theme
- `theme.meta.appearance` - Either "light" or "dark"

### UI
- `theme.ui.fg.default` - Default foreground color
- `theme.ui.fg.subtle` - Subtle foreground color
- `theme.ui.fg.accent` - Accent foreground color
- `theme.ui.fg.contrast` - Contrast foreground color
- `theme.ui.fg.disabled` - Disabled foreground color
- `theme.ui.fg.negative` - Error foreground color
- `theme.ui.fg.positive` - Success foreground color
- `theme.ui.fg.warn` - Warning foreground color
- `theme.ui.fg.info` - Info foreground color
- `theme.ui.fg.hint` - Hint foreground color

- `theme.ui.bg.default` - Default background color
- `theme.ui.bg.panel` - Panel background color
- `theme.ui.bg.float` - Floating UI background color
- `theme.ui.bg.active` - Active item background color
- `theme.ui.bg.disabled` - Disabled item background color
- `theme.ui.bg.hover` - Hover state background color
- `theme.ui.bg.selection` - Selection background color
- `theme.ui.bg.contrast` - Contrast background color

### Palette (ANSI Colors)
- `theme.palette.black` - ANSI Black (0)
- `theme.palette.darkRed` - ANSI DarkRed (1)
- `theme.palette.darkGreen` - ANSI DarkGreen (2)
- `theme.palette.darkYellow` - ANSI DarkYellow (3)
- `theme.palette.darkBlue` - ANSI DarkBlue (4)
- `theme.palette.darkMagenta` - ANSI DarkMagenta (5)
- `theme.palette.darkCyan` - ANSI DarkCyan (6)
- `theme.palette.lightGray` - ANSI LightGray (7)
- `theme.palette.gray` - ANSI Gray (8)
- `theme.palette.red` - ANSI Red (9)
- `theme.palette.green` - ANSI Green (10)
- `theme.palette.yellow` - ANSI Yellow (11)
- `theme.palette.blue` - ANSI Blue (12)
- `theme.palette.magenta` - ANSI Magenta (13)
- `theme.palette.cyan` - ANSI Cyan (14)
- `theme.palette.white` - ANSI White (15)

## WezTerm Theme Documentation

- [WezTerm Color Schemes Documentation](https://wezfurlong.org/wezterm/config/appearance.html)
- [WezTerm TOML Configuration](https://wezfurlong.org/wezterm/config/files.html)