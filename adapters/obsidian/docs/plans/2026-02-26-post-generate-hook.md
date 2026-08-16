# Post-Generate Hook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Add a `postGenerate` hook to the adapter system so `adapters:dev` can
trigger post-generation steps (like obsidian's CSS assembly) automatically.

**Architecture:** Add optional `postGenerate` field to adapter config schema and
Zod validation. After `generate` runs for any adapter, read its config and
execute the hook command if present. Extract obsidian's assembly logic into
`scripts/postGenerate.ts` and align `deno.json` with the standard adapter
pattern.

**Tech Stack:** Deno, TypeScript, Zod, JSON Schema

---

### Task 1: Add `postGenerate` to adapter config schema (core)

**Files:**

- Modify: `adapter.schema.json:6-43` (core repo)
- Modify: `src/lib/validate-adapter.ts:26-30` (core repo)

**Step 1: Add `postGenerate` to JSON schema**

In `/Users/nbr/repos/black-atom-industries/core/adapter.schema.json`, add the
`postGenerate` property inside `properties` (after `enabled`, before
`collections`):

```json
"postGenerate": {
    "type": "string",
    "description": "Shell command to run in the adapter directory after generation completes (e.g. assembly step)"
}
```

**Step 2: Add `postGenerate` to Zod schema**

In `/Users/nbr/repos/black-atom-industries/core/src/lib/validate-adapter.ts`,
add `postGenerate` to the return schema object at line 28:

```typescript
return z.object({
  $schema: z.string(),
  enabled: z.boolean().optional().default(true),
  postGenerate: z.string().optional(),
  collections: collectionsSchema,
});
```

**Step 3: Verify lint passes**

Run: `cd /Users/nbr/repos/black-atom-industries/core && deno task lint`
Expected: no errors

**Step 4: Commit**

```bash
cd /Users/nbr/repos/black-atom-industries/core
git add adapter.schema.json src/lib/validate-adapter.ts
git commit -m "feat: add optional postGenerate hook to adapter config schema"
```

---

### Task 2: Run `postGenerate` hook after generation (core)

**Files:**

- Modify: `src/tasks/adapters/generate.ts` (core repo)

**Step 1: Add helper to read adapter config and run postGenerate**

Add this function before `generateAllRepositories` in
`/Users/nbr/repos/black-atom-industries/core/src/tasks/adapters/generate.ts`:

```typescript
import { existsSync } from "@std/fs";
import { createAdapterConfigSchema } from "../../lib/validate-adapter.ts";
import { themeKeys } from "../../types/theme.ts";

async function runPostGenerate(
  adapterDir: string,
  adapter: string,
): Promise<void> {
  const configPath = join(adapterDir, config.adapterFileName);
  if (!existsSync(configPath)) return;

  const adapterConfigSchema = createAdapterConfigSchema(themeKeys);
  const adapterConfig = adapterConfigSchema.parse(
    JSON.parse(await Deno.readTextFile(configPath)),
  );

  if (adapterConfig.postGenerate) {
    log.info(`Running postGenerate for ${adapter}...`);
    const parts = adapterConfig.postGenerate.split(" ");
    await runCommand(parts, { cwd: adapterDir });
  }
}
```

Note: add `existsSync` to the existing `@std/fs` import if not already there, or
add the import. Add `createAdapterConfigSchema` and `themeKeys` imports.

**Step 2: Call `runPostGenerate` in `generateAllRepositories`**

In the `cb` callback, after the `generate` command (line 45) and before the git
status check (line 48), add:

```typescript
await runPostGenerate(adapterDir, adapter);
```

**Step 3: Call `runPostGenerate` in `generateSingleAdapter`**

After the `generate` command (line 127) and before the git status check (line
130), add:

```typescript
await runPostGenerate(adapterDir, adapterName);
```

**Step 4: Verify lint passes**

Run: `cd /Users/nbr/repos/black-atom-industries/core && deno task lint`
Expected: no errors

**Step 5: Commit**

```bash
cd /Users/nbr/repos/black-atom-industries/core
git add src/tasks/adapters/generate.ts
git commit -m "feat: run postGenerate hook after adapter generation"
```

---

### Task 3: Create `scripts/postGenerate.ts` in obsidian

**Files:**

- Create: `scripts/postGenerate.ts` (obsidian repo)

**Step 1: Create the postGenerate script**

Create `/Users/nbr/repos/black-atom-industries/obsidian/scripts/postGenerate.ts`
with the assembly logic extracted from `build.ts` (lines 24-97, minus the
generate call and formatting):

```typescript
/**
 * Black Atom Obsidian Theme — Post-Generate Assembly
 *
 * Assembles theme.css from:
 * 1. Style Settings YAML (variants + UI settings)
 * 2. Generated per-theme CSS files
 * 3. Static UI CSS files
 *
 * Called automatically by core's adapters:dev after generation,
 * or manually via `deno task postGenerate`.
 */

import { config } from "./config.ts";

async function collectFiles(
  dir: string,
  ext: string,
): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(ext)) {
      files.push(`${dir}/${entry.name}`);
    }
  }
  return files.sort();
}

function buildVariantsSettingsBlock(yaml: string): string {
  return `/* @settings\n${yaml}*/\n`;
}

function buildUiSettingsBlock(fragments: string[]): string {
  const { name, id } = config.styleSettingsSections.ui;
  const header = `/* @settings\nname: "${name}"\nid: ${id}\nsettings:\n`;
  const body = fragments.join("\n");
  return `${header}${body}\n*/\n`;
}

async function postGenerate(): Promise<void> {
  console.log("Assembling theme.css...");

  const parts: string[] = [];

  // Variants settings block
  const variantsYaml = await Deno.readTextFile(
    `${config.paths.styles}/variants.settings.yaml`,
  );
  parts.push(buildVariantsSettingsBlock(variantsYaml));

  // UI settings block (assembled from sidecars)
  const settingsFiles = await collectFiles(
    config.paths.ui,
    ".settings.yaml",
  );
  const fragments: string[] = [];
  for (const file of settingsFiles) {
    const content = await Deno.readTextFile(file);
    fragments.push(content.trimEnd());
  }
  if (fragments.length > 0) {
    parts.push(buildUiSettingsBlock(fragments));
  }

  // Generated theme CSS
  const themeFiles = (await collectFiles(config.paths.themes, ".css"))
    .filter((f) => !f.includes(".template."));
  for (const file of themeFiles) {
    const content = await Deno.readTextFile(file);
    parts.push(content.trimEnd());
  }

  // UI CSS
  const uiCssFiles = (await collectFiles(config.paths.ui, ".css"))
    .filter((f) => !f.endsWith(".settings.yaml"));
  for (const file of uiCssFiles) {
    const content = await Deno.readTextFile(file);
    parts.push(content.trimEnd());
  }

  // Write output
  await Deno.writeTextFile(config.paths.output, parts.join("\n\n") + "\n");
  console.log(`Assembly complete: ${config.paths.output}`);
}

postGenerate();
```

**Step 2: Verify it runs**

Run:
`cd /Users/nbr/repos/black-atom-industries/obsidian && deno run --allow-read --allow-write scripts/postGenerate.ts`
Expected: "Assembling theme.css..." then "Assembly complete: theme.css"

**Step 3: Commit**

```bash
cd /Users/nbr/repos/black-atom-industries/obsidian
git add scripts/postGenerate.ts
git commit -m "feat: add postGenerate script for theme.css assembly"
```

---

### Task 4: Simplify `build.ts` and align `deno.json` (obsidian)

**Files:**

- Modify: `scripts/build.ts` (obsidian repo)
- Modify: `deno.json` (obsidian repo)
- Modify: `black-atom-adapter.json` (obsidian repo)

**Step 1: Replace `build.ts` with a simple orchestrator**

Replace the entire contents of
`/Users/nbr/repos/black-atom-industries/obsidian/scripts/build.ts`:

```typescript
/**
 * Black Atom Obsidian Theme — Full Build
 *
 * Runs generate + postGenerate + format.
 * For standalone builds (not driven by adapters:dev).
 */

async function run(cmd: string[]): Promise<void> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await command.output();
  if (code !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}`);
  }
}

async function build(): Promise<void> {
  console.log("Building Black Atom Obsidian theme...");

  console.log("Step 1: Generating theme tokens...");
  await run(["deno", "task", "generate"]);

  console.log("Step 2: Assembling theme.css...");
  await run(["deno", "task", "postGenerate"]);

  console.log("Step 3: Formatting...");
  await run(["deno", "fmt", "."]);

  console.log("Build complete.");
}

build();
```

**Step 2: Update `deno.json`**

Replace the entire contents of
`/Users/nbr/repos/black-atom-industries/obsidian/deno.json`:

```json
{
  "tasks": {
    "generate": "deno run -A jsr:@black-atom/core/cli generate",
    "postGenerate": "deno run --allow-read --allow-write scripts/postGenerate.ts",
    "build": "deno run --allow-read --allow-write --allow-run scripts/build.ts",
    "dev": "deno run -A jsr:@black-atom/core/cli generate --watch",
    "update": "deno cache --reload jsr:@black-atom/core/cli",
    "fmt": "deno fmt .",
    "fmt:check": "deno fmt --check .",
    "lint": "deno lint ."
  },
  "fmt": {
    "indentWidth": 2,
    "exclude": ["themes/collection.template.css"]
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

**Step 3: Add `postGenerate` to `black-atom-adapter.json`**

In `/Users/nbr/repos/black-atom-industries/obsidian/black-atom-adapter.json`,
add the `postGenerate` field after `$schema`:

```json
{
  "$schema": "https://raw.githubusercontent.com/black-atom-industries/core/refs/heads/main/adapter.schema.json",
  "postGenerate": "deno task postGenerate",
  "collections": {
```

**Step 4: Verify full build works**

Run: `cd /Users/nbr/repos/black-atom-industries/obsidian && deno task build`
Expected: generate runs, postGenerate assembles, fmt formats — no errors

**Step 5: Verify lint passes**

Run: `cd /Users/nbr/repos/black-atom-industries/obsidian && deno task lint`
Expected: no errors

**Step 6: Commit**

```bash
cd /Users/nbr/repos/black-atom-industries/obsidian
git add scripts/build.ts deno.json black-atom-adapter.json
git commit -m "refactor: align deno.json with standard adapter pattern, add postGenerate hook"
```

---

### Task 5: End-to-end verification

**Step 1: Run `adapters:dev` in core and trigger a change**

With `adapters:dev` running in core, make a small change to a theme file (e.g.
tweak a color value). Verify:

- The watcher picks up the change
- Obsidian's theme files get regenerated
- `postGenerate` runs and `theme.css` is updated
- The new color value appears in `theme.css`

**Step 2: Verify Obsidian picks up the change**

Toggle the theme in Obsidian (or reload CSS) and confirm the new color is
visible.
