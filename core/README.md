# Black Atom Core

> The core theme definitions and generation engine for the Black Atom theme ecosystem

## What is Black Atom Core?

Black Atom Core is the central package for all theme definitions in the Black Atom theme ecosystem. It is:

- The **single source of truth** for all theme colors and styling
- A **theme generation engine** that processes templates to create platform-specific theme files
- A **command-line interface** for theme management and generation

This modular architecture keeps styling consistent across all supported platforms while allowing platform-specific output through adapters.

For details on the color token system, see [Color Token System](./docs/color_tokens_system.md).

## Available Theme Collections

Every Black Atom theme ships here. [`catalog.ts`](src/themes/catalog.ts) lists the collections and their themes.

## Usage

Adapters live in `adapters/<name>/` in this repository, alongside core.

From the repo root:

```bash
# Regenerate every adapter
deno run -A core/src/tasks/generate.ts

# Watch core and every adapter's templates, regenerate and reapply the active theme on change
deno task dev
```

From inside a single adapter directory (`adapters/<name>/`):

```bash
# Regenerate this adapter only
deno run -A ../../core/src/cli/index.ts generate

# Watch this adapter's templates, regenerate on change
deno run -A ../../core/src/cli/index.ts generate --watch
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

delta, ghostty, herdr, kagi, lazygit, niri, nvim, obsidian, tmux, tuicr, waybar, wezterm, zed, each under `adapters/<name>/`.

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
(cd monitor && deno task dev)

# Run tests
deno task test

# Generate the adapter JSON schema
deno task schema
```

`deno task check` and `deno task test` at the repo root run typechecking, linting, formatting, and
tests across every workspace member, core included.

### Creating New Themes and Adapters

Theme files export colors through `defineThemeColors()`, which resolves primaries, accents,
palette, feedback, UI, and syntax in dependency order. Each collection's `mod.ts` calls
`defineCollection()` with collection metadata (`key`, `label`, `order`) and a theme map whose
entries contain `meta` (`name`, `appearance`, `status`) and `colors`. The helper derives each
theme's key, label, and collection metadata.

The `collections` tuple in `src/themes/catalog.ts` drives collection and theme key types;
`themeCatalog` combines the collections' `.themes` maps, and `collectionOrder` sorts by `meta.order`.

Detailed guides live in `.agents/skills/`:

- `repo-new-theme` — add a theme to an existing collection
- `repo-new-adapter` — add a platform adapter
- `repo-rename-theme` — rename a theme across core, adapters, and generated files

## Contributing

Contributions are welcome. If you'd like to improve existing themes or add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `deno task check` and `deno task test`
5. Create a pull request

## License

MIT - See [LICENSE](./LICENSE.md) for details
