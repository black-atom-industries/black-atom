# Black Atom

A family of dark and light themes for developer tools. Six collections, each with its own palette
and mood: `default`, `jpn`, `terra`, `stations`, `mnml`, `paper`. Every theme is defined once and
rendered for each platform through an adapter, so the same colors show up in your terminal, editor,
and everything else you point Black Atom at.

## Layout

- `core/` — theme definitions (`core/src/themes/<collection>/`), the generator CLI
  (`core/src/cli/index.ts`), the adapter schema (`core/adapter.schema.json`), and a preview app
  (`core/monitor/`)
- `adapters/<name>/` — one directory per platform: ghostty, herdr, lazygit, niri, nvim, obsidian,
  tmux, waybar, wezterm, zed
- `livery/` — the desktop app that applies a theme across the tools on a machine. GUI binary
  `livery-gui`, terminal client `livery`
- `website/`, `ui/` — placeholders

## Getting started

```bash
git clone https://github.com/nikbrunner/black-atom.git
cd black-atom
deno install
deno task dev      # adapter watcher, livery, and monitor together
deno task generate # regenerate every adapter once
deno task check     # deno check, deno lint, deno fmt --check
deno task test       # deno test -P and cargo test
```

## Using the themes without livery

Each adapter ships its generated theme files in the same tree. Grab them directly, or use livery
to apply them for you (see below).

**Terminals and multiplexers** (ghostty, tmux, wezterm) read a generated config file from
`adapters/<name>/themes/<collection>/`. See `adapters/ghostty/README.md`,
`adapters/tmux/README.md`, `adapters/wezterm/README.md` for the exact path and how to point the
app at it.

**Editors** (zed, obsidian) take a theme file dropped into the app's own theme directory, or a
setting that points at one. See `adapters/zed/README.md` and `adapters/obsidian/README.md`.

**System tools** (niri, waybar, herdr, lazygit) read a generated config or CSS file. herdr and
waybar share one template across collections instead of one per collection. See
`adapters/niri/README.md`, `adapters/waybar/README.md`, `adapters/herdr/README.md`,
`adapters/lazygit/README.md`.

**Neovim** installs straight from this repo, no livery required. Put `adapters/nvim` on the
runtimepath:

```lua
vim.opt.rtp:prepend("<path>/adapters/nvim")
```

or point your plugin manager at the directory instead. Then, before `:colorscheme`, set
`vim.g.black_atom_core_config` (optional, everything you omit keeps its default):

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
vim.cmd.colorscheme("black-atom-jpn-koyo-yoru")
```

Defaults live in `adapters/nvim/lua/black-atom/config.lua`. See `adapters/nvim/README.md` for the
full theme list and plugin support.

## livery

```bash
cd livery && deno task build  # build the app bundle
livery setup                  # detect installed apps, write config
livery apply <theme>          # apply a theme everywhere livery manages
```

The GUI ships as `livery-gui`; the terminal client is `livery`, with a bare `livery` opening a
theme picker.

## Releases

Releases run through release-please on conventional commits. The repo carries one version for
core, the adapters and livery together, tagged `v*`. Nothing is published yet.

## License

MIT, see `core/LICENSE.md` and the LICENSE files in the adapters that carry one.
