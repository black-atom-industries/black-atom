# Black Atom delta Themes

Black Atom diff colors for [delta](https://github.com/dandavison/delta), the git pager.

## Installation

Generate the theme files (requires [Deno](https://deno.land/)):

```bash
deno run -A ../../core/src/cli/index.ts generate
```

Then include your preferred theme from your git config, before your own `[delta]` section so your
settings win:

```ini
[include]
    path = /path/to/black-atom/adapters/delta/themes/clay/black-atom-clay-dark.gitconfig
```

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

## What Gets Themed

Each theme file sets delta's `[delta]` section directly:

- **Appearance**: `dark` or `light`, so delta never guesses the background
- **Diff lines**: added and removed line backgrounds, with stronger backgrounds for the changed words
- **Line numbers**: added, removed, and context numbers, and the column separators
- **Headers**: file name, file and hunk decorations, hunk line numbers

Syntax highlighting uses delta's `ansi` theme, which takes its colors from your terminal. Pair it
with a Black Atom terminal theme.

## Development

Theme files are generated from `themes/collection.template.gitconfig` through the Black Atom core
CLI. Run `deno run -A ../../core/src/cli/index.ts generate` after editing it.

## License

MIT License - see [LICENSE](LICENSE) file for details.
