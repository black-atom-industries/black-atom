---
name: new-adapter
description: Add a new platform adapter to Black Atom, from theme templates through livery wiring. Load when asked to support a new app or tool with Black Atom themes.
---

# New Adapter

Adds a platform to `adapters/<name>/` and, if livery should apply it, wires a Rust updater and a
frontend settings page.

## 1. Research the target format

Find where the app's theme file lives, its extension, and how the app loads it (config key, file
drop, plugin). Read `core/adapter.schema.json` for the adapter config shape. Read
`adapters/ghostty/themes/default/collection.template.conf` and
`adapters/zed/themes/default/collection.template.json` as two worked examples of Eta templates:
`<%= theme.ui.bg.default %>` style token references, never `theme.primaries.*`.

## 2. Map tokens

Use only semantic tokens: `theme.ui.bg.*`, `theme.ui.fg.*`, `theme.palette.*` (16-color ANSI set),
`theme.syntax.*`, `theme.meta.label`, `theme.meta.appearance`. Never reference `theme.primaries.*`
from a template. If the target format needs a value no token covers, ask before inventing one.

## 3. Scaffold the adapter directory

Create `adapters/<name>/`:

- `black-atom-adapter.json` — copy the `collections` block verbatim from
  `adapters/ghostty/black-atom-adapter.json` (all six collections: `default`, `jpn`, `terra`,
  `stations`, `mnml`, `paper`, each with its current theme keys) and change only the `template`
  path per collection to `./themes/<collection>/collection.template.<ext>`.
- `deno.json` — copy from `adapters/ghostty/deno.json` unchanged (same `generate`/`dev`/`update`
  tasks in every adapter).
- `README.md` — what the adapter is, install/usage for the target app.
- `themes/<collection>/collection.template.<ext>` — one per collection, or one shared
  `themes/collection.template.<ext>` if every collection needs the same mapping (see herdr,
  waybar).

Add `./adapters/<name>` to the `workspace` array in the root `deno.json`.

## 4. Generate and verify

```bash
deno task generate
grep -r "undefined" adapters/<name>/themes/ || echo clean
```

Read one generated dark theme and one light theme under `adapters/<name>/themes/<collection>/`.
Confirm dark themes have dark backgrounds, light themes have light backgrounds, and no template
tag survived unrendered.

## 5. Decide: does livery apply this adapter?

If the app only needs the generated files (user copies them manually), stop here. If livery should
switch this app's theme automatically, continue.

## 6. Register `AppName`

`livery/src-tauri/src/config/types.rs`: add the variant to `enum AppName`, to `AppName::all()`,
and to `as_str()`. `livery/src-tauri/src/config/defaults.rs`: add a default `AppConfig` entry
(`config_path`, `match_pattern` + `replace_template` for text-patch apps, or `themes_path` for
linked/merged apps — see `livery/ADAPTERS.md` for the three provisioning classes).
`livery/src-tauri/src/themes/registry.rs`: add the variant's arm to `provisioning()` and to the
other `match app` blocks in that file (placement, editable fields). These are exhaustive Rust
matches; the compiler rejects a missing arm.

## 7. Write the updater

Create `livery/src-tauri/src/updaters/<name>.rs` with `pub fn update(app_str: &str, app_config:
&AppConfig, ctx: &UpdateContext) -> UpdateResult`. Use `file_ops::text::patch_text_file` for a
regex-replace config line (see `updaters/ghostty.rs`), or `file_ops::jsonc`/`file_ops::yaml` for
structural patching (see `updaters/zed.rs`, `updaters/lazygit.rs`). Register the module with `mod
<name>;` at the top of `livery/src-tauri/src/updaters/mod.rs` and add an arm to `dispatch_update`'s
`match app` there.

## 8. Test

Load the `backend-testing` skill. Add realistic input/expected fixture pairs under
`livery/src-tauri/tests/fixtures/`, write `#[cfg(test)] mod tests` in `<name>.rs` following
`updaters/zed.rs`, include an idempotency test. Run:

```bash
cargo test
```

This regenerates `livery/src/bindings.ts` — never hand-edit that file.

## 9. Frontend settings page

List `livery/src/components/settings/adapter-pages/` to confirm current files, then add
`<name>.tsx` there following `zed.tsx` (linked/structural apps) or `ghostty.tsx` (text-patch
apps): same `AdapterPageProps` shape, `AdapterHeader` + `DraftField`s for editable config fields +
`ActionRow`. Register the component in that directory's `index.ts`
(`adapterSettingsPages` map, keyed by the new `AppName`).

## 10. Verify and commit

```bash
deno task check
deno task test
```

Commit with `feat(livery): add <name> adapter black-atom-industries/livery#68` (adjust scope/issue
per the root `CLAUDE.md` commit conventions). Do not stage automatically; leave the diff for
review.
