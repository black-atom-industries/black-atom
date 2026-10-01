# Black Atom

Dark and light themes for developer tools. Every theme is defined once and generated for each tool, so the same colors
show up in the terminal, the editor, and the rest of the desktop. Livery switches most of them at once.

## Install

On macOS, build and install the livery app and the `livery` command from a clone, with [Deno](https://deno.com) and
[Rust](https://rustup.rs) installed:

```bash
git clone https://github.com/nikbrunner/black-atom.git
cd black-atom
deno install
deno task install:macos
```

The themes themselves need no install: each directory under [`adapters/`](adapters) holds the generated files and a
README on wiring its tool up by hand.

## Usage

Livery sets everything up, from the desktop app or the `livery` command:

```bash
livery setup          # find your tools' configs, link the theme files, apply a theme you pick
livery apply          # choose a theme from a fuzzy picker
livery apply <theme>  # apply one theme everywhere
```

Livery switches a tool by rewriting a line its config already has, such as Ghostty's `theme = …`.
[`livery/ADAPTERS.md`](livery/ADAPTERS.md) names that line for each tool; add it once before the first apply. On macOS
and GNOME, applying a theme also switches the system appearance to match, unless you turn that off in the config.

## Collections

Themes are grouped into collections, each with its own palette and mood. A theme key names its collection and its
appearance, for example `black-atom-jpn-koyo-dark`. [`core/src/themes/catalog.ts`](core/src/themes/catalog.ts) lists the
collections and their themes.

## Adapters

[`livery/ADAPTERS.md`](livery/ADAPTERS.md) describes every tool: what livery links or writes, the config line it rewrites,
how the tool reloads, and the tools livery leaves to you.

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) covers the repository layout, development tasks, Git hooks, and releases.

## License

MIT, see [`core/LICENSE.md`](core/LICENSE.md) and the LICENSE files in the adapters that carry one.
