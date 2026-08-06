---
name: core-architecture
description: Use when navigating the core codebase, understanding component structure, theme definitions, color utilities, or the type system.
---

# Core Architecture Reference

## Core Components

### CLI (`src/cli/`)

- `index.ts`: Command entrypoint
- `generate.ts`: Process templates and create theme files, with optional watch mode
- `help.ts`: Display command help

### Task System (`src/tasks/`)

- `adapters:gen`: Generate all repositories without committing
- `adapters:status`: Show status overview of all repositories
- `adapters:commit`: Generate and commit all repositories with confirmation
- `adapters:push`: Push repositories to remote (aborts if uncommitted changes)
- `adapters:reset`: Reset repositories to their remote state (with confirmation)
- `adapters:each`: Run a command in every adapter repository

Task system files in `src/tasks/adapters/`:

- `generate.ts`: Processing all repositories
- `watch.ts`: Intelligent file watching
- `push-all.ts`: Pushing changes to remote
- `reset.ts`: Resetting repositories to remote state
- `status.ts`: Status overview
- `forEachAdapter.ts`: Adapter iteration and command execution
- `utils.ts`: Shared task utilities

### Theme System (`src/themes/`)

- **Collections**: Organized into collections (Default, JPN, Stations, Terra, MNML, Paper)
- **Shared Components**: UI and syntax definitions shared across themes within a collection
- **Theme Definition**: Each theme has its own TypeScript file defining colors and properties
- **Color System**: Uses OKLCH color space with helpers in `src/utils/color.ts`

### Color Utilities (`src/utils/color.ts`)

- **`oklch(l, c, h)`**: Converts OKLCH values to hex color
  - `l` (lightness): 0-1, where 0 is black and 1 is white
  - `c` (chroma): typically 0-0.4, represents color intensity
  - `h` (hue): 0-360 degrees, color angle on the color wheel
- **`tint({color, with, amount})`**: Tints a base color with another color

### Adapter System

- **Configuration**: Reads `black-atom-adapter.json` from adapter repositories
- **Template Processing**: Uses Eta template engine to process template files
- **Variable Injection**: Injects theme properties into templates
- **File Generation**: Creates theme files from processed templates
- **Generation**: Implemented in `src/cli/generate.ts` and `src/lib/template.ts`

### Type System (`src/types/`)

- **Theme Interface**: Defines the structure of theme objects
- **Collection Keys**: Enumerates available theme collections
- **Theme Keys**: Maps theme names to their collection and variant

## Theme Definition Structure

All themes use OKLCH color space. The `oklch()` helper converts OKLCH values to hex at build time.

```typescript
import type { ThemeDefinition, ThemePrimaryColors } from "../../types/theme.ts";
import { themeKeyMetaMap } from "../../types/themes.ts";
import { oklch } from "../../utils/color.ts";

const primaries: ThemePrimaryColors = {
    d10: oklch(0.199, 0.015, 196.04),
    d20: oklch(0.225, 0.016, 196.09),
    // ...
};

const theme: ThemeDefinition = {
    meta: themeKeyMetaMap["black-atom-default-dark"],
    primaries,
    palette,
    accents,
    feedback,
    ui,
    syntax,
};
```

## Creating a New Collection

1. Create `src/themes/new-collection/`.
2. Add the collection's `create-palette-*`, `create-feedback-*`, `create-ui-*`, and `create-syntax-*` modules.
3. Create theme definitions using those creator modules.
4. Add collection metadata and theme metadata in `src/types/theme.ts` and `src/types/themes.ts`.
5. Register definitions in `src/themes/map.ts` and display order in `src/config.ts`.
6. Regenerate the adapter schema with `deno task schema`.
7. Run `deno task checks`.
