---
name: repo-new-adapter
description: Add a new platform adapter to Black Atom, from theme templates through livery wiring. Load when asked to support a new app or tool with Black Atom themes.
---

# New Adapter

Adds a platform to `adapters/<name>/` and, if livery should apply it, wires a Rust updater and a
frontend settings page.

## 1. Research the target format

Find where the app's theme file lives, its extension, and how the app loads it (config key, file
drop, plugin). Read `core/adapter.schema.json` for the adapter config shape. Read
`adapters/ghostty/themes/collection.template.conf` and
`adapters/zed/themes/default/collection.template.json` as two worked examples of Eta templates:
`<%= theme.ui.bg.default %>` style token references, never `theme.primaries.*`.

## 2. Map tokens

Use only semantic tokens: `theme.ui.bg.*`, `theme.ui.fg.*`, `theme.palette.*` (16-color ANSI set),
`theme.syntax.*`, `theme.meta.label`, `theme.meta.appearance`. Never reference `theme.primaries.*`
from a template. If the target format needs a value no token covers, ask before inventing one.

## 3. Scaffold the adapter directory

Create `adapters/<name>/`:

- `black-atom-adapter.json`: copy `adapters/ghostty/black-atom-adapter.json` verbatim (every
  collection with all its theme keys).
  Every collection points at one shared template, `./themes/collection.template.conf`; change the
  extension. When collections need different mappings, point each collection's `template` at
  `./themes/<collection>/collection.template.<ext>` instead (see zed). Keep each collection's
  `output` at `./themes/<collection>`.
- `README.md`: what the adapter is, install/usage for the target app.
- `LICENSE`: copy from any other adapter.
- The template: one shared `themes/collection.template.<ext>` (see ghostty, herdr, waybar), or one
  `themes/<collection>/collection.template.<ext>` per collection.

Keep the adapter outside the Deno workspace. Core discovers it from its
`black-atom-adapter.json` during central generation.

## 4. Generate and verify

```bash
deno task generate
grep -r "undefined" adapters/<name>/themes/ || echo clean
```

Read one generated dark theme and one light theme under `adapters/<name>/themes/<collection>/`.
Confirm dark themes have dark backgrounds, light themes have light backgrounds, and no template
tag survived unrendered. When the app can load a theme file from the command line, load a dark and
a light one in it.

## 5. Register the adapter name

These sites list adapters by name; each needs the new one, in alphabetical order:

- `core/src/lib/adapter-generation.test.ts`: `adapterNames`. The test compares it against the
  discovered adapter dirs.
- `core/README.md`: the list under "Adapters".

## 6. Embed in livery

Livery ships every adapter's generated themes in its binary, whether or not it applies them
(niri, waybar, and wezterm ship without an updater). Add the adapter to:

- `livery/core/build.rs`: the `rerun-if-changed` paths.
- `livery/core/src/themes/embedded.rs`: the `Adapter` enum, `Adapter::ALL` (and its length),
  `dir_name()`, a `static` `include_dir!` of `adapters/<name>/themes`, and `embedded()`.
- `scripts/dev-cycle.ts`: the adapter alternation in `isCliInput`.
- `livery/core/tests/setup_smoke.rs`: the `report.adapters` count, and one generated file in the
  unpacked-files list.

## 7. Decide: does livery apply this adapter?

If the app only needs the generated files (user copies them manually), add it to "Not switched by livery"
in `livery/ADAPTERS.md` and skip to step 13. If livery
should switch this app's theme automatically, continue.

## 8. Register `AppName`

`livery/core/src/config/types.rs`: add the variant to `enum AppName`, to `AppName::all()`,
and to `as_str()`. `livery/core/src/config/defaults.rs`: add a default `AppConfig` entry
(`config_path`, `match_pattern` + `replace_template` for text-patch apps, or `themes_path` for
merged apps; see `livery/ADAPTERS.md` for the three provisioning classes). A Linked app with
`themes_path: None` gets its links in `themes/` next to `config_path`.
`livery/core/src/themes/embedded.rs`: map the variant in `AppName::adapter()`.
`livery/core/src/themes/registry.rs`: add the variant's arm to `provisioning()`,
`linked_placement()`, and `editable_fields()`, and pin its fields in
`test_editable_fields_matches_updaters`. These are exhaustive Rust matches; the compiler rejects a
missing arm.

## 9. Write the updater

A text-patch app with no reload needs no module: route it to `patch_text_updater` in
`dispatch_update` (see delta, helm-tmux, tuicr). Otherwise create
`livery/core/src/updaters/<name>.rs` with `pub fn update(app_str: &str, app_config: &AppConfig,
ctx: &UpdateContext) -> UpdateResult`. Use `file_ops::text::patch_text_file` for a regex-replace
config line (see `updaters/ghostty.rs`), or `file_ops::jsonc`/`file_ops::yaml` for structural
patching (see `updaters/zed.rs`, `updaters/lazygit.rs`). Register the module with `mod <name>;` at
the top of `livery/core/src/updaters/mod.rs` and add an arm to `dispatch_update`'s `match app`
there.

## 10. Test

For a new updater module, load the `repo-backend-testing` skill. Add realistic input/expected fixture
pairs under `livery/core/tests/fixtures/`, write `#[cfg(test)] mod tests` in `<name>.rs` following
`updaters/zed.rs`, include an idempotency test.

For a Linked app, add it to the link loop in `livery/core/tests/setup_smoke.rs` and one of its
links to the symlink assertions there; the status check expects every Linked adapter wired.

Run:

```bash
deno task test:rust
```

This regenerates `livery/src/bindings.ts`. Never hand-edit that file.

## 11. Frontend settings page

List `livery/src/components/settings/adapter-pages/` to confirm current files, then add
`<name>.tsx` there following `zed.tsx` (linked/structural apps) or `ghostty.tsx` (text-patch
apps): same `AdapterPageProps` shape, `AdapterHeader` + `DraftField`s for editable config fields +
`ActionRow`, and a `PrerequisiteNote` for any setup precondition (see `tmux.tsx`). Register the
component in that directory's `index.ts` (`adapterSettingsPages` map, keyed by the new
`AppName`). `livery/src/routes/dev/components.tsx` keys two fixtures by every `AppName`: the
fixture config's `apps` and `SETTINGS_EDITABLE_FIELDS`.

## 12. Document the contract

`livery/ADAPTERS.md`: add the app to its class in the provisioning table, and a per-adapter
contract section (files, switch pointer, reload, precondition).

## 13. Verify and commit

```bash
deno task verify
```

Commit through `repo-commit`: `feat(<name>): add <name> adapter` for the adapter, and a separate
`feat(livery): apply <name> themes` for the livery wiring.
