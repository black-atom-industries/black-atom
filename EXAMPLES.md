# Black Atom Adapter Template Examples

This document provides example templates in different formats to help you create your own adapter templates.

## JSON Template (VS Code, Zed)

```json
{
  "name": "<%= theme.meta.label %>",
  "type": "<%= theme.meta.appearance %>",
  "colors": {
    "editor.background": "<%= theme.ui.bg.default %>",
    "editor.foreground": "<%= theme.ui.fg.default %>",
    "editorCursor.foreground": "<%= theme.ui.fg.accent %>",
    "editor.selectionBackground": "<%= theme.ui.bg.selection %>",
    "editor.lineHighlightBackground": "<%= theme.ui.bg.active %>",
    "editorLineNumber.foreground": "<%= theme.ui.fg.subtle %>",
    "editorLineNumber.activeForeground": "<%= theme.ui.fg.default %>",
    "editorWidget.background": "<%= theme.ui.bg.panel %>",
    "editorWidget.border": "<%= theme.ui.bg.hover %>",
    "statusBar.background": "<%= theme.ui.bg.panel %>",
    "statusBar.foreground": "<%= theme.ui.fg.default %>",
    "statusBar.debuggingBackground": "<%= theme.ui.bg.info %>",
    "panel.background": "<%= theme.ui.bg.panel %>",
    "panel.border": "<%= theme.ui.bg.hover %>",
    "tab.activeBackground": "<%= theme.ui.bg.default %>",
    "tab.inactiveBackground": "<%= theme.ui.bg.panel %>",
    "terminal.background": "<%= theme.ui.bg.default %>",
    "terminal.foreground": "<%= theme.ui.fg.default %>",
    "terminal.ansiBlack": "<%= theme.palette.black %>",
    "terminal.ansiRed": "<%= theme.palette.red %>",
    "terminal.ansiGreen": "<%= theme.palette.green %>",
    "terminal.ansiYellow": "<%= theme.palette.yellow %>",
    "terminal.ansiBlue": "<%= theme.palette.blue %>",
    "terminal.ansiMagenta": "<%= theme.palette.magenta %>",
    "terminal.ansiCyan": "<%= theme.palette.cyan %>",
    "terminal.ansiWhite": "<%= theme.palette.white %>"
  },
  "tokenColors": [
    {
      "scope": ["comment", "punctuation.definition.comment"],
      "settings": {
        "foreground": "<%= theme.syntax.comment.default %>"
      }
    },
    {
      "scope": ["string", "string.regexp"],
      "settings": {
        "foreground": "<%= theme.syntax.string.default %>"
      }
    },
    {
      "scope": ["constant", "constant.numeric", "constant.language"],
      "settings": {
        "foreground": "<%= theme.syntax.constant.default %>"
      }
    },
    {
      "scope": ["keyword", "storage"],
      "settings": {
        "foreground": "<%= theme.syntax.keyword.default %>"
      }
    },
    {
      "scope": ["entity.name.function", "support.function"],
      "settings": {
        "foreground": "<%= theme.syntax.func.default %>"
      }
    },
    {
      "scope": ["variable"],
      "settings": {
        "foreground": "<%= theme.syntax.variable.default %>"
      }
    }
  ]
}
```

## Lua Template (Neovim)

```lua
local M = {}

-- Theme metadata
M.meta = {
    key = "<%= theme.meta.key %>",
    label = "<%= theme.meta.label %>",
    appearance = "<%= theme.meta.appearance %>",
    collection = {
        key = "<%= theme.meta.collection.key %>",
        label = "<%= theme.meta.collection.label %>",
    },
}

-- Theme palettes
M.palette = {
    black = "<%= theme.palette.black %>",
    gray = "<%= theme.palette.gray %>",
    dark_red = "<%= theme.palette.darkRed %>",
    red = "<%= theme.palette.red %>",
    dark_green = "<%= theme.palette.darkGreen %>",
    green = "<%= theme.palette.green %>",
    dark_yellow = "<%= theme.palette.darkYellow %>",
    yellow = "<%= theme.palette.yellow %>",
    dark_blue = "<%= theme.palette.darkBlue %>",
    blue = "<%= theme.palette.blue %>",
    dark_magenta = "<%= theme.palette.darkMagenta %>",
    magenta = "<%= theme.palette.magenta %>",
    dark_cyan = "<%= theme.palette.darkCyan %>",
    cyan = "<%= theme.palette.cyan %>",
    light_gray = "<%= theme.palette.lightGray %>",
    white = "<%= theme.palette.white %>",
}

-- UI colors
M.ui = {
    bg = {
        default = "<%= theme.ui.bg.default %>",
        panel = "<%= theme.ui.bg.panel %>",
        float = "<%= theme.ui.bg.float %>",
        active = "<%= theme.ui.bg.active %>",
        disabled = "<%= theme.ui.bg.disabled %>",
        hover = "<%= theme.ui.bg.hover %>",
        selection = "<%= theme.ui.bg.selection %>",
        search = "<%= theme.ui.bg.search %>",
        contrast = "<%= theme.ui.bg.contrast %>",
    },
    fg = {
        default = "<%= theme.ui.fg.default %>",
        subtle = "<%= theme.ui.fg.subtle %>",
        accent = "<%= theme.ui.fg.accent %>",
        disabled = "<%= theme.ui.fg.disabled %>",
        contrast = "<%= theme.ui.fg.contrast %>",
    },
}

-- Setup function for the theme
function M.setup()
    vim.cmd("hi clear")
    if vim.fn.exists("syntax_on") then
        vim.cmd("syntax reset")
    end
    vim.o.termguicolors = true
    vim.g.colors_name = "<%= theme.meta.key %>"

    -- Define highlight groups
    local highlights = {
        -- UI elements
        Normal = { fg = M.ui.fg.default, bg = M.ui.bg.default },
        NormalFloat = { fg = M.ui.fg.default, bg = M.ui.bg.float },
        Cursor = { fg = M.ui.bg.default, bg = M.ui.fg.accent },
        CursorLine = { bg = M.ui.bg.active },
        LineNr = { fg = M.ui.fg.subtle },
        CursorLineNr = { fg = M.ui.fg.default },
        Visual = { bg = M.ui.bg.selection },
        Search = { bg = M.ui.bg.search, fg = M.ui.fg.contrast },
        StatusLine = { bg = M.ui.bg.panel, fg = M.ui.fg.default },

        -- Syntax highlighting
        Comment = { fg = "<%= theme.syntax.comment.default %>", italic = true },
        String = { fg = "<%= theme.syntax.string.default %>" },
        Number = { fg = "<%= theme.syntax.number.default %>" },
        Boolean = { fg = "<%= theme.syntax.boolean.default %>" },
        Identifier = { fg = "<%= theme.syntax.variable.default %>" },
        Function = { fg = "<%= theme.syntax.func.default %>" },
        Keyword = { fg = "<%= theme.syntax.keyword.default %>" },
        Type = { fg = "<%= theme.syntax.type.default %>" },
    }

    -- Apply highlights
    for group, style in pairs(highlights) do
        vim.api.nvim_set_hl(0, group, style)
    end
end

return M
```

## CSS Template (Web, Obsidian)

```css
/*
 * Theme: <%= theme.meta.label %>
 * Appearance: <%= theme.meta.appearance %>
 * Collection: <%= theme.meta.collection.label %>
 */

:root {
  --background: <%= theme.ui.bg.default %>;
  --foreground: <%= theme.ui.fg.default %>;
  --accent: <%= theme.ui.fg.accent %>;
  --border: <%= theme.ui.bg.hover %>;
  --selection-bg: <%= theme.ui.bg.selection %>;
  --panel-bg: <%= theme.ui.bg.panel %>;
  --active-bg: <%= theme.ui.bg.active %>;
  --hover-bg: <%= theme.ui.bg.hover %>;
  --subtle-fg: <%= theme.ui.fg.subtle %>;

  /* Syntax colors */
  --comment: <%= theme.syntax.comment.default %>;
  --string: <%= theme.syntax.string.default %>;
  --number: <%= theme.syntax.number.default %>;
  --keyword: <%= theme.syntax.keyword.default %>;
  --function: <%= theme.syntax.func.default %>;
  --variable: <%= theme.syntax.variable.default %>;
  --type: <%= theme.syntax.type.default %>;

  /* Palette colors */
  --red: <%= theme.palette.red %>;
  --green: <%= theme.palette.green %>;
  --yellow: <%= theme.palette.yellow %>;
  --blue: <%= theme.palette.blue %>;
  --magenta: <%= theme.palette.magenta %>;
  --cyan: <%= theme.palette.cyan %>;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}

a {
  color: var(--accent);
}

pre {
  background-color: var(--panel-bg);
  border: 1px solid var(--border);
}

.button {
  background-color: var(--panel-bg);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.button:hover {
  background-color: var(--hover-bg);
}

.button:active {
  background-color: var(--active-bg);
}

/* Syntax highlighting */
.token.comment {
  color: var(--comment);
  font-style: italic;
}

.token.string {
  color: var(--string);
}

.token.number {
  color: var(--number);
}

.token.keyword {
  color: var(--keyword);
}

.token.function {
  color: var(--function);
}

.token.variable {
  color: var(--variable);
}
```

## CONF Template (Ghostty, Terminal)

```conf
# Theme: <%= theme.meta.label %>
# Appearance: <%= theme.meta.appearance %>

# Background and foreground
background = <%= theme.ui.bg.default %>
foreground = <%= theme.ui.fg.default %>

# Cursor
cursor-color = <%= theme.ui.fg.accent %>
cursor-text = <%= theme.ui.fg.contrast %>

# Selection
selection-background = <%= theme.ui.bg.selection %>
selection-foreground = <%= theme.ui.fg.default %>

# Terminal palette
palette = 0=<%= theme.palette.black %>
palette = 1=<%= theme.palette.red %>
palette = 2=<%= theme.palette.green %>
palette = 3=<%= theme.palette.yellow %>
palette = 4=<%= theme.palette.blue %>
palette = 5=<%= theme.palette.magenta %>
palette = 6=<%= theme.palette.cyan %>
palette = 7=<%= theme.palette.white %>
palette = 8=<%= theme.palette.gray %>
palette = 9=<%= theme.palette.red %>
palette = 10=<%= theme.palette.green %>
palette = 11=<%= theme.palette.yellow %>
palette = 12=<%= theme.palette.blue %>
palette = 13=<%= theme.palette.magenta %>
palette = 14=<%= theme.palette.cyan %>
palette = 15=<%= theme.palette.white %>

# Tab bar
tab-bar-background = <%= theme.ui.bg.panel %>
tab-bar-foreground = <%= theme.ui.fg.default %>
```

## YAML/TOML Template

```yaml
# Theme: <%= theme.meta.label %>
# Appearance: <%= theme.meta.appearance %>

# Colors
colors:
  background: <%= theme.ui.bg.default %>
  foreground: <%= theme.ui.fg.default %>
  accent: <%= theme.ui.fg.accent %>
  selection: <%= theme.ui.bg.selection %>
  cursor: <%= theme.ui.fg.accent %>

  # UI Element Colors
  ui:
    panel: <%= theme.ui.bg.panel %>
    hover: <%= theme.ui.bg.hover %>
    active: <%= theme.ui.bg.active %>
    subtle: <%= theme.ui.fg.subtle %>

  # Terminal Colors
  terminal:
    black: <%= theme.palette.black %>
    red: <%= theme.palette.red %>
    green: <%= theme.palette.green %>
    yellow: <%= theme.palette.yellow %>
    blue: <%= theme.palette.blue %>
    magenta: <%= theme.palette.magenta %>
    cyan: <%= theme.palette.cyan %>
    white: <%= theme.palette.white %>

# Syntax Highlighting
syntax:
  comment: <%= theme.syntax.comment.default %>
  string: <%= theme.syntax.string.default %>
  number: <%= theme.syntax.number.default %>
  boolean: <%= theme.syntax.boolean.default %>
  keyword: <%= theme.syntax.keyword.default %>
  function: <%= theme.syntax.func.default %>
  variable: <%= theme.syntax.variable.default %>
  type: <%= theme.syntax.type.default %>
```

## Example folder structure for an adapter

```
my-adapter/
├── LICENSE
├── README.md
├── deno.json
├── black-atom-adapter.json
└── themes/
    ├── default/
    │   ├── collection.template.ext
    │   ├── black-atom-default-dark.ext
    │   ├── black-atom-default-dark-dimmed.ext
    │   ├── black-atom-default-light.ext
    │   └── black-atom-default-light-dimmed.ext
    ├── jpn/
    │   ├── collection.template.ext
    │   ├── black-atom-jpn-koyo-hiru.ext
    │   ├── black-atom-jpn-koyo-yoru.ext
    │   ├── black-atom-jpn-tsuki-yoru.ext
    │   └── black-atom-jpn-murasaki-yoru.ext
    ├── mnml/
    │   ├── collection.template.ext
    │   ├── black-atom-mnml-clay-dark.ext
    │   └── ...
    ├── stations/
    │   ├── collection.template.ext
    │   ├── black-atom-stations-engineering.ext
    │   ├── black-atom-stations-medical.ext
    │   ├── black-atom-stations-operations.ext
    │   └── black-atom-stations-research.ext
    ├── terra/
    │   ├── collection.template.ext
    │   ├── black-atom-terra-fall-day.ext
    │   ├── black-atom-terra-fall-night.ext
    │   ├── black-atom-terra-spring-day.ext
    │   ├── black-atom-terra-spring-night.ext
    │   ├── black-atom-terra-summer-day.ext
    │   ├── black-atom-terra-summer-night.ext
    │   ├── black-atom-terra-winter-day.ext
    │   └── black-atom-terra-winter-night.ext
    └── paper/
        ├── collection.template.ext
        ├── black-atom-paper-brown-light.ext
        └── ...
```

Replace `.ext` with your platform's preferred file extension (`.json`, `.lua`, `.css`, etc.).

Note how each collection has a single `collection.template.ext` file that is used to generate all the theme files for that collection. This reduces duplication and makes maintenance much easier.

