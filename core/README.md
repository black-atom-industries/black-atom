# Black Atom Core

The theme definitions and the generator for every Black Atom adapter. The package is private and runs from source inside
this monorepo.

- [`docs/colors.md`](../docs/colors.md) explains the color model.
- [`docs/theme-design.md`](../docs/theme-design.md) explains how themes are designed.
- [`docs/adapter-guide.md`](../docs/adapter-guide.md) explains generation, templates and the package exports.

## Layout

- `src/themes/`: one directory per collection. [`catalog.ts`](src/themes/catalog.ts) lists them.
- `src/types/`: the theme types.
- `src/lib/`: generation, template rendering, adapter discovery, the adapter schema, and contrast analysis.
- `src/utils/`: color utilities.
- `src/cli/`: the `generate` command.
- `src/tasks/`: the tasks behind the root scripts.
- `adapter.schema.json`: generated. Regenerate it with `npm run schema`.

## Commands

Run from `core/`:

| Command          | What it does                                                 |
| ---------------- | ------------------------------------------------------------ |
| `npm run dev`    | Watches core and every adapter's templates, and regenerates. |
| `npm run schema` | Regenerates `adapter.schema.json`.                           |

Generation, contrast and checks run from the repo root. See [`docs/adapter-guide.md`](../docs/adapter-guide.md#tasks).

## Prerequisites

- [Node.js](https://nodejs.org/) 24.11+
- [ImageMagick](https://imagemagick.org/) for palette extraction from images (`magick` CLI)

A `.mise.toml` is included. Run `mise install` to get all project tools.
