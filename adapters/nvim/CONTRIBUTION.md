# Contributing to Black Atom for Neovim

## Getting Started

1. Create a branch for your contribution.
2. Make your changes under `adapters/nvim/`.
3. Run `mise run check` before opening a pull request.

## Style Guidelines

Commit messages follow the root [`AGENTS.md`](../../AGENTS.md) convention:
`<type>(<scope>): <description> <issue-reference>`. Use `nvim` as the scope for changes scoped
to this adapter.

Lua code is checked with Luacheck and formatted with StyLua:

```bash
stylua --check .   # verify formatting
stylua .            # format in place
```

`.luarc.json` sets `diagnostics.globals: ["vim"]` to suppress false positives on the `vim`
global.

## How Highlights Are Structured

Each plugin's highlight groups live in a Lua file under
`lua/black-atom/highlights/plugins/`, keyed by the plugin's repo name with dots swapped for
underscores (`telescope.nvim` becomes `telescope_nvim.lua`). Every file returns a `map` function:

```lua
---@type BlackAtom.Highlights
return {
    HighlightGroup1 = { ... },
    HighlightGroup2 = { ... },
    ...
}
```

This structure is what lets the supported-plugins list in the README be generated
automatically.

## Adding Plugin Support

1. Create a new file in `lua/black-atom/highlights/plugins/`, named after the plugin.
2. Use `__plugin_highlight_template.lua` as a starting point.
3. Implement the highlight groups inside the `map` function.
4. From `adapters/nvim/`, run `./update_supported_plugins.sh` to update the README's plugin
   list.
