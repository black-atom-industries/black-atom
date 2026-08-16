# Black Atom for Neovim

> A collection of elegant, cohesive themes for Neovim by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Neovim adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## Available Themes

Black Atom includes multiple theme collections, each with dark and light variants:

| Collection   | Description                   |
| ------------ | ----------------------------- |
| **Default**  | Core Black Atom themes        |
| **JPN**      | Japanese-inspired themes      |
| **MNML**     | Minimalist accent themes      |
| **Paper**    | Paper-inspired themes         |
| **Stations** | Space station-inspired themes |
| **Terra**    | Earth season-inspired themes  |

## Installation

Put this directory on the runtimepath. Any plugin manager that can point at a
directory works, or do it by hand:

```lua
vim.opt.rtp:prepend("/path/to/black-atom/adapters/nvim")
vim.cmd.colorscheme("black-atom-jpn-koyo-yoru")
```

Every theme is a self-contained colorscheme in `colors/`, so `:colorscheme
black-atom-<collection>-<name>` is all it takes. Tab-complete the list.

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

The `styles.syntax` entries take any highlight attributes (`bold`, `italic`,
`underline`, ...), which are merged into the group's definition.

To change the config at runtime, set the global again and re-run
`:colorscheme`.

## LSP completion

Black Atom defines the native `LspKind{Function, Class, Variable, ...}` highlight
groups (one per LSP `CompletionItemKind`) in `lsp.lua`.

- **`blink.cmp` / `nvim-cmp`** consume the shared kind-color mapping directly,
  no wiring required.
- **`mini.completion`** needs a small `process_items` callback to route the
  theme's `LspKind*` groups to the popup. See the recipe:
  [docs/recipes.md#color-minicompletion-kind-labels](docs/recipes.md#color-minicompletion-kind-labels).

## Supported Plugins

<details>
<summary>Click to expand supported plugins list</summary>

This theme supports the following plugins:

- [arrow.nvim](https://github.com/otavioschwanck/arrow.nvim)
  - 4 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [blink.cmp](https://github.com/saghen/blink.cmp)
  - 8 Highlight(s)
  - Last updated: 2025-02-16
  - Last commit: revert: rename `syn` variables to `syntax`
- [codediff.nvim](https://github.com/esmuellert/codediff.nvim)
  - 31 Highlight(s)
  - Last updated: 2026-03-31
  - Last commit: feat(highlights/plugins): add codediff.nvim support
- [diffview.nvim](https://github.com/sindrets/diffview.nvim)
  - 24 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [edgy.nvim](https://github.com/folke/edgy.nvim)
  - 5 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [flash.nvim](https://github.com/folke/flash.nvim)
  - 6 Highlight(s)
  - Last updated: 2025-02-16
  - Last commit: revert(themes): restore full parameter names
- [flux.nvim](https://github.com/nikbrunner/flux.nvim)
  - 13 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [fyler.nvim](https://github.com/A7Lavinraj/fyler.nvim)
  - 30 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [fzf-lua](https://github.com/ibhagwan/fzf-lua)
  - 7 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [gitsigns.nvim](https://github.com/lewis6991/gitsigns.nvim)
  - 9 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [glance.nvim](https://github.com/DNLHC/glance.nvim)
  - 28 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [indent-blankline.nvim](https://github.com/lukas-reineke/indent-blankline.nvim)
  - 2 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [mini.nvim](https://github.com/echasnovski/mini.nvim)
  - 178 Highlight(s)
  - Last updated: 2026-06-06
  - Last commit: feat(highlights/plugins): add MiniCmdline highlight groups
- [neo-tree.nvim](https://github.com/nvim-neo-tree/neo-tree.nvim)
  - 13 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [nvim-cmp](https://github.com/hrsh7th/nvim-cmp)
  - 12 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [nvim-navbuddy](https://github.com/SmiteshP/nvim-navbuddy)
  - 8 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [nvim-tree.lua](https://github.com/nvim-tree/nvim-tree.lua)
  - 4 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [nvim-treesitter-context](https://github.com/nvim-treesitter/nvim-treesitter-context)
  - 2 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [obsidian.nvim](https://github.com/obsidian-nvim/obsidian.nvim)
  - 11 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [render-markdown.nvim](https://github.com/MeanderingProgrammer/render-markdown.nvim)
  - 69 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)
  - 6 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [which-key.nvim](https://github.com/folke/which-key.nvim)
  - 5 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors
- [yazi.nvim](https://github.com/mikavilpas/yazi.nvim)
  - 1 Highlight(s)
  - Last updated: 2026-06-05
  - Last commit: style(terra/mnml): refine summer and orange-light palette colors

</details>

## Development

### Roadmap

- [ ] Minimize default highlight assignments
  - The default assignment and links should be used as far as possible
- [ ] Make API stable
- [ ] Dediated Black Atom Colorscheme Picker

### Tooling

Dev tooling is managed with [mise](https://mise.jdx.dev):

```bash
mise install      # lua, lua-language-server, stylua
mise run setup    # luacheck (via luarocks)
```

`luacheck` has no prebuilt binary, so it can't be a mise `[tools]` entry. Installing
`lua` through mise also provides `luarocks` (added to `PATH`), and the `setup` task
runs `luarocks install luacheck` into that Lua install. Note this lives under the
shared `lua@5.1` install rather than the repo. Re-run `mise run setup` if you bump
the pinned Lua version. Building `luacheck`'s dependencies needs a C compiler
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
[Deno](https://deno.land/) installed.

1. Edit the template in `templates/collection.template.lua` (one template, all collections)
2. Generate theme files:
   ```bash
   deno task generate
   ```
3. Or use watch mode for live regeneration:
   ```bash
   deno task dev
   ```

## License

MIT - See [LICENSE](./LICENSE) for details
