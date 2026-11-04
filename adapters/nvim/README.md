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

There is no `setup()`. Set `vim.g.black_atom_core_config` before the
`:colorscheme` call and the values below get merged over the defaults. A partial
table is fine, anything you leave out keeps its default.

```lua
vim.g.black_atom_core_config = {
    term_colors = true,
    styles = {
        ending_tildes = false,
        cmp_kind_color_mode = "bg", -- "fg" | "bg"
        dark_sidebars = true,
        dark_floats = true,
        dark_gutter = false,
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
...), which are merged into the group's definition.

To change the config at runtime, set the global again and re-run
`:colorscheme`.

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

The helper adds the cells to any column format, so it works on top of the one you already
use. Replace the format in `PaddedStatuscolumn` with your own:

```lua
local function pad_gutter(base)
    local padding = 2
    local win = vim.g.statusline_winid
    local wo = vim.wo[win]
    local gutter = wo.number or wo.relativenumber or wo.signcolumn ~= "no"

    -- `Normal` would show as a notch on a float's panel background.
    if not gutter or vim.api.nvim_win_get_config(win).relative ~= "" then
        return base
    end

    local on_cursor = wo.cursorline and vim.v.relnum == 0 and vim.v.virtnum <= 0
    return base .. (on_cursor and "%#CursorLine#" or "%#Normal#") .. string.rep(" ", padding)
end

function _G.PaddedStatuscolumn()
    -- The default columns: folds, signs, line number.
    return pad_gutter("%C%s%=%l ")
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

- [ ] Minimize default highlight assignments
    - The default assignment and links should be used as far as possible
- [ ] Make API stable
- [ ] Dedicated Black Atom Colorscheme Picker

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
