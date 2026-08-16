# Black Atom Core

[![JSR](https://jsr.io/badges/@black-atom/core)](https://jsr.io/@black-atom/core)

> The core theme definitions and generation engine for the Black Atom theme ecosystem

## What is Black Atom Core?

Black Atom Core is the central package for all theme definitions in the Black Atom theme ecosystem. It is:

- The **single source of truth** for all theme colors and styling
- A **theme generation engine** that processes templates to create platform-specific theme files
- A **command-line interface** for theme management and generation

This modular architecture keeps styling consistent across all supported platforms while allowing platform-specific output through adapters.

For details on the color token system, see [Color Token System](./docs/color_tokens_system.md).

## Available Theme Collections

| Collection   | Themes                                                     | Description                   |
| ------------ | ---------------------------------------------------------- | ----------------------------- |
| **Default**  | dark, dark-dimmed, light, light-dimmed                     | Core default themes           |
| **Stations** | engineering, operations, medical, research                 | Space station-inspired themes |
| **JPN**      | koyo-hiru, koyo-yoru, murasaki-yoru, tsuki-yoru            | Japanese-inspired themes      |
| **Terra**    | seasons (spring, summer, fall, winter) x time (day, night) | Earth season-inspired themes  |
| **MNML**     | 47, clay, eink, ita, mikado, mono, orange, osman           | Minimalist themes             |

## Usage

Adapters live in `adapters/<name>/` in this repository, alongside core.

From the repo root:

```bash
# Regenerate every adapter
deno task generate

# Watch core and every adapter's templates, regenerate on change
deno task dev:adapters
```

From inside a single adapter directory (`adapters/<name>/`):

```bash
# Regenerate this adapter only
deno task generate

# Watch this adapter's templates, regenerate on change
deno task dev
```

### Theme Adaptation

The core CLI adapts theme files by:

1. Reading an adapter's `black-atom-adapter.json`
2. Processing its template files with the Eta template engine
3. Replacing template variables with values from core theme definitions
4. Writing adapted files next to their templates

## Adapter Pattern

Black Atom uses an adapter pattern to support multiple platforms:

1. **Core**: defines all theme colors and properties
2. **Adapters**: implement themes for specific platforms (Neovim, terminals, etc.)
3. **Templates**: transform core definitions into platform-specific formats

Each adapter directory contains:

- Template files (e.g., `.template.lua`, `.template.json`)
- A `black-atom-adapter.json` configuration file, validated against `core/adapter.schema.json`
- Generated theme files

### Adapters

ghostty, herdr, lazygit, niri, nvim, obsidian, tmux, waybar, wezterm, zed, each under `adapters/<name>/`.

## Development

### Prerequisites

- [Deno](https://deno.land/) runtime
- [ImageMagick](https://imagemagick.org/) for palette extraction from images (`magick` CLI)

A `.mise.toml` is included. Run `mise install` to get all project tools.

### Development Commands

Run from `core/`:

```bash
# Watch and regenerate every adapter
deno task dev

# Run the monitor preview app
deno task monitor

# Run tests
deno task test

# Generate the adapter JSON schema
deno task schema

# Compile and install the CLI binary
deno task cli:compile
deno task cli:install

# Publish to JSR
deno task publish
```

`deno task check` and `deno task test` at the repo root run typechecking, linting, formatting, and
tests across every workspace member, core included.

> **Note on `--allow-slow-types`**: The publish task uses `--allow-slow-types` because the theme
> registry in `src/types/themes.ts` relies on `as const satisfies` patterns to preserve literal
> type narrowing (e.g., knowing a theme's appearance is `"dark"` not `"dark" | "light"`). JSR's
> fast check cannot resolve these inferred types. Tracked in
> [DEV-292](https://linear.app/black-atom-industries/issue/DEV-292).

### Creating New Themes and Adapters

Detailed guides live in `.claude/skills/`:

- `new-theme` — add a theme to an existing collection
- `new-adapter` — add a platform adapter
- `rename-theme` — rename a theme across core, adapters, and generated files

## Contributing

Contributions are welcome. If you'd like to improve existing themes or add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `deno task check` and `deno task test`
5. Create a pull request

## License

MIT - See [LICENSE](./LICENSE) for details
