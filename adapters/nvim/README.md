# Black Atom for Neovim

The Neovim adapter for Black Atom. Themes are defined once in [`../../core/`](../../core/),
and each adapter renders them for one platform through Eta templates, so the colors match
everywhere and each platform can still tune its own details.

## Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the
collections and their themes.

## Installation

Put this directory on the runtimepath. Any plugin manager that can point at a
directory works, or do it by hand:

```lua
vim.opt.rtp:prepend("/path/to/black-atom/adapters/nvim")
vim.cmd.colorscheme("black-atom-jpn-koyo-dark")
```

Every theme is a self-contained colorscheme in `colors/`. Load one with `:colorscheme
black-atom-<collection>-<name>`, and tab-complete to see the list.

## Configuration

There is no `setup()`. The options come from three layers, merged key by key, each over the one
before it:

1. The defaults in `lua/black-atom/config.lua`.
2. `apps.nvim.settings` in Livery's `config.json`, at
   `$XDG_CONFIG_HOME/black-atom/livery/config.json` (`~/.config` when `$XDG_CONFIG_HOME` is unset).
3. `vim.g.black_atom_core_config`, from your own Neovim config.

Your own table always wins, and only for the keys it names. Set before startup ends (in your
`init.lua`, for example), it applies to the theme Neovim opens with. Set later (in `after/plugin`
or on `VimEnter`), it applies from the next `:colorscheme`. A partial table is fine:

```lua
vim.g.black_atom_core_config = {
    styles = {
        dark_gutter = true,
    },
}
```

The full set, with its defaults:

```lua
vim.g.black_atom_core_config = {
    term_colors = true,
    styles = {
        ending_tildes = false,
        cmp_kind_color_mode = "bg", -- "fg" | "bg"
        dark_sidebars = true,
        dark_floats = true,
        dark_gutter = false,
        gutter_padding = 0, -- see "Pad the dark gutter"
        transparency = "none", -- "none" | "partial" | "full"
        diagnostics = {
            undercurl = false,
            background = false,
        },
        syntax = {
            comments = { italic = true },
            keywords = { bold = true },
            functions = {},
            strings = { italic = false },
            variables = {},
            messages = { bold = true },
        },
    },
}
```

`dark_sidebars`, `dark_floats` and `dark_gutter` put those areas on the panel background.
The `styles.syntax` entries take any highlight attributes (`bold`, `italic`, `underline`,
...), which are merged into the group's definition. Some highlights set their own attributes,
such as the bold on `@function.call`. To turn one off, set it to `false` in your own table. In
`config.json`, a `false` only applies when the group's defaults name that attribute, because
Livery stores both flags of every group.

The layers are read at every `:colorscheme`. To change the config at runtime, set the global or
edit the file, then re-run `:colorscheme`. Turning `term_colors` off takes effect in new Neovims,
because a running one keeps the terminal colors it already set.

### The theme at startup

Once your config and the start packages have loaded, the plugin checks whether a colorscheme is
set. If you called `:colorscheme` yourself, yours stays. If not, the plugin applies `active_theme`
from `config.json`. A name it can't apply gives one warning, and Neovim keeps starting.

### With Livery

Livery's setup links its managed copy of this directory into `$XDG_DATA_HOME/nvim/site/pack/black-atom/start/`, so
Neovim opens in the active theme with its options from `config.json`, with no line in your config
and even with no config at all. Livery never edits your Neovim files.

Applying a theme switches every running Neovim to it. Saving options in Livery's settings page, and
editing them in `config.json` while Livery runs, re-apply each running Neovim's current Black Atom
theme, and leave an instance on another colorscheme alone.

`apps.nvim.enabled = false` in `config.json` turns all of this off: the plugin then behaves as if
there were no `config.json`, with no startup theme and no settings layer. A missing key counts as
enabled.

Livery searches the `.lua` and `.vim` files under `$XDG_CONFIG_HOME/nvim` (symlinks followed,
`colors/` and hidden directories skipped) for two kinds of line. A line that sets
`vim.g.black_atom_core_config` makes the settings page read-only and names the file and line,
because your table would win over anything saved there. A `:colorscheme` with a literal name, such
as `vim.cmd.colorscheme("black-atom-jpn-koyo-dark")`, gets a note: Neovim starts in the theme from
that line, and Livery still reloads running instances. A name passed through a variable doesn't
match. The search reads lines, so a rare false match is possible.

### Without Livery

There is no `config.json`, so the defaults and your own table are all there is. Nothing applies a
theme for you, so call `:colorscheme` as in [Installation](#installation).

## LSP completion

Black Atom defines the native `LspKind{Function, Class, Variable, ...}` highlight
groups (one per LSP `CompletionItemKind`) in `lsp.lua`.

- `blink.cmp` and `nvim-cmp` use the shared kind-color mapping without any wiring.
- `mini.completion` needs a small `process_items` callback to route the
  theme's `LspKind*` groups to the popup. See
  [the recipe](#color-minicompletion-kind-labels).

## Plugins

Each supported plugin has a file in
[`lua/black-atom/highlights/plugins/`](lua/black-atom/highlights/plugins/).

## Recipes

### Pad the dark gutter

With `styles.dark_gutter = true`, the gutter sits right against the code. Blank cells in
`Normal` at the end of the `statuscolumn` separate the two. The built-in columns can't do
this, because the number column's padding always takes `LineNr`'s background.

`styles.gutter_padding` sets the number of cells, and `pad` from `black-atom.gutter` adds them
to any column format, so it works on top of the one you already use. It returns the format
unchanged while `dark_gutter` is off, and in floats and windows without a gutter. Replace the
format in `PaddedStatuscolumn` with your own:

```lua
function _G.PaddedStatuscolumn()
    -- The default columns: folds, signs, line number.
    return require("black-atom.gutter").pad("%C%s%=%l ")
end

vim.o.statuscolumn = "%!v:lua.PaddedStatuscolumn()"
```

Windows that set their own `statuscolumn` keep it and stay unpadded, such as iter.nvim's
diff views.

### Color `mini.completion` kind labels

`mini.completion` uses `mini.icons` for kind highlighting by default, so it doesn't pick up
the theme's `LspKind*` groups. A `process_items` callback can set `kind_hlgroup` before it
calls `default_process_items`, which keeps any value already on the item.

`item.kind` from the LSP response is a number from 1 to 25, and
`vim.lsp.protocol.CompletionItemKind` turns it into a name such as `Class`. Copy that table
before you shorten any names, or the lookup asks for groups that don't exist, such as
`LspKindCLAS`.

```lua
local MiniCompletion = require("mini.completion")

-- Capture BEFORE any remap of vim.lsp.protocol.CompletionItemKind, so the
-- canonical names (Class, Function, ...) are preserved for highlight lookup.
local lsp_kind_names = vim.deepcopy(vim.lsp.protocol.CompletionItemKind)

local process_items = function(items, base)
    for _, item in ipairs(items) do
        local kind_name = lsp_kind_names[item.kind]
        if kind_name then
            item.kind_hlgroup = "LspKind" .. kind_name
        end
    end
    return MiniCompletion.default_process_items(items, base, {
        kind_priority = { Text = -1, Snippet = 99 },
    })
end

require("mini.completion").setup({
    lsp_completion = { process_items = process_items },
})
```

For shorter popup labels, remap the global table after that copy. `mini.completion` reads the
labels from it, so the popup shows `CLAS` and `FUNC` while the highlight groups still use the
full names:

```lua
local item_kinds = vim.lsp.protocol.CompletionItemKind
for i, name in ipairs(item_kinds) do
    item_kinds[i] = name:sub(1, 4):upper()
end
```

## Development

### Roadmap

Open work lives in the
[issues labeled `adapter:nvim`](https://github.com/black-atom-industries/black-atom/issues?q=is%3Aissue%20state%3Aopen%20label%3Aadapter%3Anvim).

### Tooling

Dev tooling is managed with [mise](https://mise.jdx.dev):

```bash
mise install      # lua, lua-language-server, stylua
mise run setup    # luacheck (via luarocks)
```

`luacheck` has no prebuilt binary, so it can't be a mise `[tools]` entry. Installing
`lua` through mise also provides `luarocks` (added to `PATH`), and the `setup` task
runs `luarocks install luacheck` into that Lua install, which is the shared `lua@5.1`
one. Re-run `mise run setup` if you bump the pinned Lua version. Building `luacheck`'s dependencies needs a C compiler
(Xcode Command Line Tools on macOS).

### Building and Testing

Run all checks (luacheck, lua-language-server, stylua):

```bash
mise run check
```

Individual tasks are also available: `mise run lint`, `mise run typecheck`,
`mise run fmt-check`, and `mise run fmt` (formats in place). CI runs the same
`mise run check`, so a green local run matches CI.

### Working with Templates

Theme files are generated from templates through the Black Atom core CLI. You need
[Node.js](https://nodejs.org/) 24+ installed.

1. Edit the template in `templates/collection.template.lua` (one template, all collections)
2. Generate theme files:
    ```bash
    node ../../core/src/cli/index.ts generate
    ```
3. Or use watch mode for live regeneration:
    ```bash
    node ../../core/src/cli/index.ts generate --watch
    ```

## License

MIT - See [LICENSE](./LICENSE) for details
