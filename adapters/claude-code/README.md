# Black Atom for Claude Code

> Claude Code custom themes generated from the Black Atom theme system.

## About

This directory is the [Claude Code](https://code.claude.com/) adapter for Black Atom. It contains a
committed [custom theme](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme) for
every Black Atom theme.

Each theme sets `base` to `dark-ansi` or `light-ansi` from the theme's appearance and overrides the
text, status, diff, and background tokens with exact Black Atom colors. Tokens it leaves out fall
through to the ANSI base, so they follow the terminal palette.

## Collections

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

Generated files live at `themes/<collection>/<theme-key>.json`.

## Usage

### Livery (recommended)

1. Run `livery setup`, or open Livery settings and enable the Claude Code adapter. Setup finds
   every `~/.claude*` config folder with a `settings.json`, such as `~/.claude-work` for a
   `CLAUDE_CONFIG_DIR` profile, and lets you add others.
2. Pick any Black Atom theme in Livery.
3. Select the Black Atom theme in Claude Code's `/theme` once per config folder. That stores
   `"theme": "custom:black-atom"` in its `settings.json`, which never changes again.

Livery copies the selected theme to `themes/black-atom.json` in every config folder and never
writes `settings.json`. Claude Code watches `~/.claude/themes/` and reloads a changed file in a running
session. If the folder did not exist when Claude Code started, restart it once.

### Manual

Copy a theme file into `~/.claude/themes/`:

```sh
mkdir -p ~/.claude/themes
cp themes/default/black-atom-default-light.json ~/.claude/themes/
```

Select it with `/theme`, or set the filename without `.json` in `~/.claude/settings.json`:

```json
{
    "theme": "custom:black-atom-default-light"
}
```

## Development

Requirements: [Node.js](https://nodejs.org/) 24+.

```sh
node ../../core/src/cli/index.ts generate          # regenerate committed JSON files
node ../../core/src/cli/index.ts generate --watch  # regenerate on template changes
```

Claude Code accepts `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `ansi256(n)`, and `ansi:<name>` values and
silently ignores anything else, so templates emit six-digit hex only.

## License

MIT, see [LICENSE](./LICENSE).
