# Post-Generate Hook Design

## Problem

The `adapters:dev` watcher in core runs `black-atom-core generate` for each
adapter when theme files change. For most adapters (ghostty, tmux, nvim), the
generated files ARE the final output. But obsidian has an extra assembly step:
concatenating settings YAML + generated per-theme CSS + UI CSS into a single
`theme.css`.

After `adapters:dev` regenerates obsidian's theme files, nothing triggers the
assembly into `theme.css`. Running `deno task build` in obsidian re-generates
from the JSR-published core (which may not have the latest changes), overwriting
the watcher's output.

## Solution

Add a standardized `postGenerate` hook to the adapter system.

### Core Changes

**`adapter.schema.json`** — add optional `postGenerate` field:

```json
{
  "postGenerate": {
    "type": "string",
    "description": "Shell command to run after generation completes (e.g. assembly step)"
  }
}
```

**`src/tasks/adapters/generate.ts`** — after running `generate` for an adapter,
read `black-atom-adapter.json` and run `postGenerate` if present. Applies to
both `generateAllRepositories` and `generateSingleAdapter`.

### Obsidian Changes

**`black-atom-adapter.json`** — add the hook:

```json
{
  "postGenerate": "deno task postGenerate"
}
```

**`scripts/postGenerate.ts`** — new file, extracted assembly logic from
`build.ts`. Concatenates settings YAML + generated theme CSS + UI CSS into
`theme.css`.

**`scripts/build.ts`** — simplified to: generate + postGenerate + format.

**`deno.json`** — aligned with standard adapter pattern:

```json
{
  "tasks": {
    "generate": "deno run -A jsr:@black-atom/core/cli generate",
    "postGenerate": "deno run --allow-read --allow-write scripts/postGenerate.ts",
    "build": "deno task generate && deno task postGenerate && deno fmt .",
    "dev": "deno run -A jsr:@black-atom/core/cli generate --watch",
    "update": "deno cache --reload jsr:@black-atom/core/cli",
    "fmt": "deno fmt .",
    "fmt:check": "deno fmt --check .",
    "lint": "deno lint ."
  }
}
```

### Flow After Fix

```
adapters:dev (core theme change)
  → black-atom-core generate (in obsidian dir)
  → reads black-atom-adapter.json → finds postGenerate
  → runs "deno task postGenerate"
  → theme.css assembled with new colors
  → Obsidian picks up changes via symlink
```

### Files Changed

**Core repo:**

- `adapter.schema.json` — add `postGenerate` property
- `src/tasks/adapters/generate.ts` — run postGenerate after generation

**Obsidian repo:**

- `scripts/postGenerate.ts` — new, assembly-only logic
- `scripts/build.ts` — simplified to generate + postGenerate + fmt
- `deno.json` — aligned with standard pattern
- `black-atom-adapter.json` — add `postGenerate` field
