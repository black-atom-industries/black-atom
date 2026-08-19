# Ubiquitous Language

Every term the codebase uses, in one place. Use these words in code, commits, and discussion.

Terms are grouped by the part of the system they belong to: **Themes** covers what a theme is and
how it is generated, **Livery** covers the app that applies themes to a machine.

---

# Themes

## Theme Structure

| Term                 | Definition                                                                                                                      | Aliases to avoid          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Theme**            | A complete visual definition for one appearance variant, composed of metadata, primaries, palette, UI colors, and syntax colors | Colorscheme, scheme, skin |
| **Theme Key**        | Unique identifier string for a theme (e.g., `black-atom-terra-winter-night`)                                                    | ID, slug, theme name      |
| **Theme Definition** | The TypeScript object (`ThemeDefinition`) representing a complete theme — metadata plus all color groups                        | Theme config, theme data  |
| **Appearance**       | Whether a theme is `"light"` or `"dark"`                                                                                        | Mode, variant, brightness |
| **Status**           | A theme's maturity level: `"development"`, `"beta"`, or `"release"`                                                             | Stage, phase              |

## Collections

| Term               | Definition                                                                                           | Aliases to avoid               |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Collection**     | A named group of thematically related themes sharing a design concept (e.g., `jpn`, `terra`, `mnml`) | Category, family, group        |
| **Collection Key** | The string identifier for a collection: `"default"`, `"stations"`, `"jpn"`, `"terra"`, `"mnml"`      | Collection name, collection ID |

## Color Groups

| Term          | Definition                                                                                                                                                  | Aliases to avoid                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Primaries** | A 12-color gradient scale spanning dark-to-light, organized as d10-d40 (dark), m10-m40 (mid), l10-l40 (light) — the foundation all other colors derive from | Base colors, scale, gradient                 |
| **Palette**   | A 16-color ANSI terminal color set (black, red, green, yellow, blue, magenta, cyan, white + dark variants) derived from primaries                           | Terminal colors, ANSI colors                 |
| **Feedback**  | Four semantic status colors: `negative`, `success`, `info`, `warning` — represent application state, orthogonal to primaries                                | Status colors, state colors, semantic colors |
| **Accents**   | A minimal emphasis scale (a10-a40) used primarily by the MNML collection to add color without a full palette                                                | Highlights, emphasis colors                  |

## Derived Color Layers

| Term                      | Definition                                                                                                                                                                  | Aliases to avoid                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **UI Colors**             | Semantic background and foreground tokens for interface elements (default, panel, float, active, disabled, hover, selection, search, contrast, plus feedback-mapped states) | Theme tokens, design tokens     |
| **Syntax Colors**         | Color assignments for code highlighting categories (variable, string, keyword, type, comment, etc.)                                                                         | Highlight colors, editor colors |
| **Theme Creator Options** | The input structure (`{primaries, palette, feedback, accents}`) passed to UI and syntax creation functions                                                                  | Creator config, color inputs    |

## Adapter & Generation Pipeline

| Term               | Definition                                                                                                                                | Aliases to avoid               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Adapter**        | A platform-specific repository that consumes Black Atom themes and generates output files for that platform (e.g., Zed, Neovim, Obsidian) | Plugin, extension, integration |
| **Adapter Config** | The `black-atom-adapter.json` file in an adapter repo that declares its collections, templates, and optional post-generation commands     | Manifest, config file          |
| **Template**       | An Eta template file (`.template.{ext}`) in an adapter repo that receives a `ThemeDefinition` and produces platform-specific output       | Eta file, template file        |
| **Generated File** | The output artifact produced by rendering a template with theme data — the file end-users consume                                         | Output, artifact, built file   |
| **postGenerate**   | An optional shell command in adapter config that runs after template rendering (e.g., formatting, building)                               | Post-hook, after-generate      |

## Color Utilities

| Term         | Definition                                                                                                                       | Aliases to avoid        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **HexColor** | The constrained color type used throughout the system: a hex string in `#rrggbb` or `#rrggbbaa` format                           | Color string, hex value |
| **tint()**   | The primary color derivation function: blends a base color toward a target color by a specified amount using OKLCH interpolation | Mix, blend, interpolate |
| **oklch()**  | Utility that converts an OKLCH color-space value to a HexColor                                                                   | Color convert           |

## Metadata

| Term                | Definition                                                                                             | Aliases to avoid         |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| **Theme Meta**      | Metadata attached to a theme: key, name, label, appearance, status, collection                         | Header, info, properties |
| **Theme Meta Base** | The author-defined subset of metadata — excludes computed fields like `label`                          | Raw meta, base meta      |
| **Label**           | A computed display string combining theme name and collection, derived at runtime from `ThemeMetaBase` | Display name, title      |
| **Name**            | The human-readable short name for a theme (e.g., "Winter Night")                                       | Title, display name      |

---

# Livery

> Per-adapter setup contracts live in [`livery/ADAPTERS.md`](livery/ADAPTERS.md); the design spec
> lives in [`livery/docs/design-system/`](livery/docs/design-system/README.md).

## Theme Display

| Term           | Definition                                                                                                                        | Aliases to avoid  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **ThemeGroup** | A frontend display structure that pairs a Collection Key with its sorted list of Theme Definitions — used to render the picker UI | Category, section |

## Configuration

| Term                 | Definition                                                                                                                                        | Aliases to avoid             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Config**           | The user's livery configuration file (`$XDG_CONFIG_HOME/black-atom/livery/config.json`) containing a SystemAppearance toggle and per-app settings | Settings, preferences        |
| **AppConfig**        | The per-app configuration block — enabled flag, config_path, themes_path, match_pattern, and replace_template                                     | App settings, app entry      |
| **AppName**          | An enum of supported applications that livery can update; `AppName::all()` in `core/src/config/types.rs` is the list                              | App, tool, target            |
| **ConfigPath**       | The filesystem path to an app's configuration file that livery will patch                                                                         | Target file, output path     |
| **ThemesPath**       | An optional directory path where an app stores its theme files — used as a template variable, not expanded by Rust                                | Theme directory              |
| **MatchPattern**     | A regex pattern that locates the theme-setting line in an app's config file                                                                       | Search pattern, find pattern |
| **ReplaceTemplate**  | A string template with `{variable}` placeholders that produces the new theme-setting line                                                         | Template, replacement string |
| **SystemAppearance** | The OS-level dark/light mode toggle — a standalone boolean in Config, not an app with AppConfig                                                   | Dark mode, system theme      |

## Theme Provisioning

> The full per-adapter setup contracts live in [ADAPTERS.md](ADAPTERS.md).

| Term                   | Definition                                                                                                                                                              | Aliases to avoid               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Theme Provisioning** | The classification of who consumes livery's managed theme files for an adapter — External, Linked, or Merged                                                            | Adapter type, integration mode |
| **External**           | The app's theme files are provided outside of livery — by a compiled binary or the user — so livery only performs switching                                             | Unmanaged, manual              |
| **Linked**             | Livery symlinks the managed theme files into a location the app itself reads; switching selects one via a pointer in the app's config, which setup may need to add once | Symlinked, placed              |
| **Merged**             | The app cannot read external theme files, so on every switch livery reads the unpacked theme file and writes its values directly into the app's config                  | Inline, embedded               |
| **Managed Themes Dir** | `$XDG_DATA_HOME/black-atom/themes/<adapter>/` — where the themes bundled in the binary unpack; the single source Linked placements point at and Merged reads from       | Theme cache, staging dir       |
| **Setup Precondition** | A one-time manual prerequisite livery cannot automate — the Obsidian configuration folders to manage                                                                    | Requirement, dependency        |
| **Switch Pointer**     | The line or property in an app's config that selects the active theme — the thing MatchPattern finds and ReplaceTemplate rewrites                                       | Theme line, theme setting      |

## Applied State

| Term               | Definition                                                                                                                                         | Aliases to avoid                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Active Theme**   | The theme livery last applied, recorded in `$XDG_DATA_HOME/black-atom/state.json`. A record of what livery did, not a reading of the app configs   | Current theme, applied theme, record |
| **State**          | Livery's own record of what it last did — `state.json`, written by livery and never hand-edited. Distinct from **Config**, which the user owns     | Settings, cache                      |
| **Applying Theme** | The theme a run is currently writing, held in the frontend store for the duration of the run and the retry that may follow it                      | Current theme, selected theme        |
| **Applied Rule**   | The condition that moves the **Active Theme**: at least one updater returned `done`. A run that only skipped or errored leaves the record standing | Success check                        |

## Updater Pipeline

| Term              | Definition                                                                                                                                 | Aliases to avoid            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Updater**       | A per-app Rust module that knows how to patch a specific app's config file and optionally reload it                                        | Handler, writer, applier    |
| **Dispatcher**    | The routing logic in `updaters/mod.rs` that maps an AppName to its Updater                                                                 | Router, switch, handler     |
| **ThemeContext**  | The theme metadata struct passed from the frontend to the backend `update_app` command — a livery-specific projection of core's Theme Meta | Theme payload, theme params |
| **UpdateContext** | The backend-internal struct that combines ThemeContext fields with the app's ThemesPath for use in template rendering                      | Render context              |
| **UpdateResult**  | The outcome of a single Updater invocation — includes app name, status, optional message, and duration                                     | Result, response            |
| **UpdateStatus**  | The state of an Updater invocation — backend emits `done`, `error`, or `skipped`; frontend adds `pending` and `running`                    | State, outcome              |
| **UpdaterEntry**  | A frontend struct pairing an AppName with a runnable function that calls the backend                                                       | Task, job                   |

## File Operations

| Term                 | Definition                                                                                                                           | Aliases to avoid             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **FileOp**           | One of three config-patching strategies: text (regex), YAML (lossless merge), or JSONC (CST edit)                                    | Write strategy, patch method |
| **patch_text_file**  | A FileOp that uses regex match-and-replace with template variable substitution                                                       | Text replace, regex patch    |
| **patch_yaml_file**  | A FileOp that performs lossless YAML merging while preserving comments                                                               | YAML update, YAML write      |
| **patch_jsonc_file** | A FileOp that edits JSONC via CST manipulation, preserving comments and formatting                                                   | JSON edit, JSONC update      |
| **TemplateVariable** | A `{name}` placeholder in a ReplaceTemplate — resolved from themeKey, appearance, collectionKey, or themesPath                       | Placeholder, token           |
| **AtomicWrite**      | The write strategy used by all FileOps — write to a temp file, then persist (rename) to the target path                              | Safe write                   |
| **Reload**           | The optional post-patch action that signals a running app to re-read its config (e.g., SIGUSR2 for ghostty, socket command for nvim) | Refresh, restart, notify     |

## UI Lifecycle

| Term           | Definition                                                                                                                                      | Aliases to avoid            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Phase**      | The current UI state machine position — `"picking"` (user browsing themes), `"applying"` (updaters running), or `"done"` (all updates finished) | Step, stage, screen         |
| **ApplyTheme** | The frontend orchestration function that runs all UpdaterEntries sequentially, reporting progress via callbacks                                 | Run updaters, execute, sync |

## Design Language

> The full design spec lives in [`docs/design-system/`](docs/design-system/README.md) ("Warm
> Precision"). These are the terms it establishes.

| Term              | Definition                                                                                                                           | Aliases to avoid               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| **Chrome**        | Everything in the UI that is not theme content — bars, panels, labels, borders. Warm monochrome; re-tints with the selected theme    | UI shell, frame                |
| **Voice**         | One of the three type roles: Display (Space Grotesk), Mono (Iosevka — the default interface voice), Body (IBM Plex Sans, prose only) | Font, typeface (for the role)  |
| **Token**         | A `--ba-*` CSS custom property from `src/styles/tokens/` — the only way chrome expresses color, type, spacing, borders, motion       | Variable, CSS var              |
| **Re-tint**       | The runtime override of chrome tokens with the selected theme's `ui` palette via ThemeProvider — the app wears the livery it applies | Theming, skinning              |
| **Surface tier**  | One of the four tonal depth levels: recessed < default < subtle < hint. Depth comes only from these — no shadows                     | Elevation, layer (z-index ≠)   |
| **Actuator**      | An interactive control in bracket notation — `[ LABEL ]`. The Button primitive renders actuators                                     | Button (in design discussions) |
| **Pip**           | A small square status indicator: 8px StatusPip + mono label, or 4×7px mini palette pips on list rows. Always square, never a circle  | Dot, bullet, badge             |
| **Datasheet**     | The composition pattern of the theme detail panel: display-voice name → swatch bands → KV rows → code preview → doc-code footer      | Detail view, preview panel     |
| **Specimen**      | A /dev route section that renders one primitive or foundation in all its variants and states — the visual verification surface       | Story, demo                    |
| **Motif**         | A recurring visual signature: bracket actuators, square pips, `»` prompts, `n/m` counters, hairline-ruled section labels, doc codes  | Pattern (reserve for code)     |
| **Copy register** | The writing rules for chrome text: uppercase mono, `·` separators, `—` qualifiers, imperative impersonal voice, keys always named    | Tone, style guide              |
| **Brand dot**     | The 0.62em filled circle standing in for the O in `BLACK AT●M` — the only circle (and only border-radius) in the system              | Logo, icon                     |

---

## Relationships

### Themes

- A **Collection** contains one or more **Themes** sharing a design concept
- A **Theme** is uniquely identified by its **Theme Key**
- **Primaries** are the foundation — **Palette**, **UI Colors**, and **Syntax Colors** are all
  derived from them
- **Feedback** colors are orthogonal to **Primaries** — they represent application state, not the
  theme's color identity
- **Accents** optionally supplement **Primaries** for collections (like MNML) that need emphasis
  without a full **Palette**
- An **Adapter** discovers themes via core, applies them to **Templates**, and produces
  **Generated Files**
- **Theme Creator Options** bundle all color groups (**Primaries**, **Palette**, **Feedback**,
  **Accents**) as input to UI/Syntax creation

### Livery

- **Config** contains a map of **AppName** → **AppConfig** plus a **SystemAppearance** toggle
- An **AppConfig** has exactly one **MatchPattern** and one **ReplaceTemplate** (for text-based
  updaters)
- The **Dispatcher** routes an **AppName** to its **Updater**
- An **Updater** uses exactly one **FileOp** strategy and optionally performs a **Reload**
- **ApplyTheme** produces one **UpdateResult** per enabled **AppName**
- **ThemeContext** is a projection of core's **Theme Meta** — carries Theme Key, Appearance,
  Collection Key, and Theme Label across the IPC boundary
- An apply sets the **Applying Theme**, and moves the **Active Theme** only when the
  **Applied Rule** holds
- The **Active Theme** and an app's **Switch Pointer** answer different questions: the record says
  what livery wrote, the pointer says what the app reads today

## Example dialogue

> **Dev:** "When I create a new **Theme** in the `terra` **Collection**, do I need to define all
> color groups?"
>
> **Domain expert:** "You define **Primaries** and **Feedback** — those are always required.
> **Palette** is derived from **Primaries** by the collection's creator function. **Accents** are
> optional and mostly used by `mnml`."
>
> **Dev:** "And when livery applies that theme, what moves?"
>
> **Domain expert:** "The **Phase** changes to `applying` and the **Applying Theme** is set. The
> frontend builds an **UpdaterEntry** per enabled **AppName**; each **Updater** picks a **FileOp**
> and rewrites the **Switch Pointer** in that app's **ConfigPath**."
>
> **Dev:** "So after the run, the **Active Theme** is whatever I picked?"
>
> **Domain expert:** "Only if the **Applied Rule** holds — at least one **Updater** returned
> `done`. A run where every app errored leaves the previous **Active Theme** standing, because
> nothing on the machine changed."
>
> **Dev:** "And if I edit a **Switch Pointer** by hand afterwards?"
>
> **Domain expert:** "Then the **Active Theme** is stale, and deliberately so. It records what
> livery did, not what each app renders. Livery never reads the pointers back."
>
> **Dev:** "What's the difference between **Name** and **Label** on the metadata?"
>
> **Domain expert:** "**Name** is the short display name you define — like 'Winter Night'.
> **Label** is computed at runtime by combining **Name** with the **Collection** label. You never
> set **Label** directly."

## Flagged ambiguities

- **"current theme"** is the worst offender: it has meant the **Active Theme** (what livery last
  applied), the **Applying Theme** (what a run is writing), and the row under the picker cursor.
  These are three different things — a single `currentTheme` field conflating the first two caused
  a real bug, where a test-apply reverted to a client default instead of the running theme. Use
  **Active Theme**, **Applying Theme**, or "the cursored theme".
- **"app"** / **"AppName"**: "app" sometimes means "a configured application that livery can
  update" and sometimes "livery itself". Use **AppName** or "target app" for tools livery manages,
  **Livery** for the desktop application.
- **"config"** covers both livery's own **Config** and the target apps' configuration files
  (**ConfigPath**). Livery's own _record_ is **State**, a third thing again: the user owns Config,
  livery owns State.
- **"context"** appears as both **ThemeContext** (frontend → backend IPC payload) and
  **UpdateContext** (backend-internal, enriched with per-app paths).
- **"template"** — core uses **Template** for Eta adapter templates; livery uses
  **ReplaceTemplate** for regex substitution strings. Unrelated concepts; always qualify.
- **"semantic"** describes both **Feedback** colors and **UI Colors** in code comments. Reserve it
  for **UI Colors** (which map meaning to slots); call **Feedback** colors "status colors".
- **"name" vs "label" vs "key"** — **Key** is the machine identifier, **Name** the human-readable
  short form, **Label** the computed long form.
- **Palette overlap with Primaries** — **Primaries** are a continuous dark-to-light gradient,
  **Palette** a categorical 16-color ANSI mapping. "Colors" is used loosely for both.
- **UI foreground feedback states vs Feedback colors** — UI foreground has `negative`, `warn`,
  `info`, `hint`, `positive`; **Feedback** has `negative`, `success`, `info`, `warning`. The
  divergence (`success`/`positive`, `warning`/`warn`, `hint` with no equivalent) invites mistakes.
