# Changelog

## `0.10.0` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2026.10.10

### Highlights

#### Node instead of Deno

The Deno team joined Cloudflare, and Deno itself only gets bug fixes and security updates until October 2027
([announcement](https://deno.com/blog/cloudflare)). Black Atom now builds and generates on Node 24 with npm workspaces.
Building livery from a clone, generating themes, and working on an adapter need Node instead of Deno, and every task is
an npm script:

```sh
npm install
npm run install:macos   # build and install the app and the livery command
npm run generate        # regenerate every adapter's themes
```

Inside an adapter directory, `node ../../core/src/cli/index.ts generate` regenerates that adapter. Formatting, linting,
type checks, and tests run through oxfmt, ESLint, TypeScript, and Vitest
([#58](https://github.com/black-atom-industries/black-atom/issues/58)).

#### Kagi Search

A new adapter themes Kagi Search with one brutalist custom CSS per theme pair: square corners, hard offset shadows,
thick rules, uppercase titles, monospace fonts, and code blocks in the theme's syntax colors. Each file carries the light
and the dark variant and follows Kagi's appearance setting. Knobs for fonts, case, border widths, and shadow offsets sit
at the top of the file. Livery copies a theme to the clipboard, ready to paste into Kagi's custom CSS setting:

```sh
livery adapter kagi black-atom-jpn-koyo --font "JetBrains Mono"
```

Without a theme it opens a picker.

#### delta

delta gets a generated git config per theme with diff, line-number, and header colors, and `syntax-theme = ansi`. Livery
links the files into `~/.config/delta/themes/` and switches delta with the rest of your tools.

#### Refreshed themes

Minium Polymer takes its colors from Teenage Engineering hardware: neutral aluminium grays with the signature orange as
the main accent. JPN Sanshoku shares the JPN syntax and UI colors, with a full palette built from its amber, blue, and
vermilion. Default Light and Dimmed Light use more saturated accents and feedback colors, Dimmed Light has lighter
surfaces, the Default Dark and Dimmed Dark comments are brighter, and diff backgrounds use a subtler tint
([#54](https://github.com/black-atom-industries/black-atom/issues/54)).

#### Important fixes

tuicr highlights code with Black Atom syntax colors from a generated `.tmTheme`, where it used to fall back to its bundled
base16 theme. Livery links the `.tmTheme` next to each tuicr theme.

#### Upgrading from 0.9

delta switches through an include. In `~/.gitconfig.delta`, replace the `features` line and the `black-atom-dark` and
`black-atom-light` blocks with an include above your own `[delta]` section, then run `livery setup`:

```diff
-[delta]
-    features = black-atom-dark
+[include]
+    path = ~/.config/delta/themes/black-atom-default-dark.gitconfig
```

Run `livery setup` once more for tuicr as well; until then livery shows its setup as unlinked.

In an existing clone, delete the `node_modules` directories Deno created before the first `npm install`.

### Added

- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - A collection's `template` in `black-atom-adapter.json` accepts a list, and each template renders one file per theme.
- Development — nbr <nikolaus.brunner@protonmail.ch>
  - Livery has Playwright end-to-end tests that run the UI against the real backend in a fixture home ([#10](https://github.com/black-atom-industries/black-atom/issues/10)).

### Changed

- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - tuicr tints highlighted code in added and deleted lines with 30% of the diff background, so the gutter keeps the full color.
  - tuicr themes use the panel background for the main surface and the code background.
- Livery — nbr <nikolaus.brunner@protonmail.ch>
  - The theme list shows five color pips per theme: its background, its accents, then palette colors.
  - `livery apply` lists notes from successful updates, such as a deferred Obsidian reload, below the results.

### Fixed

- Development — nbr <nikolaus.brunner@protonmail.ch>
  - Development builds read the adapter themes from the working tree, so a running dev GUI never applies stale themes ([#56](https://github.com/black-atom-industries/black-atom/issues/56)).
  - The dev session state keeps only the environment variables `livery-dev` needs ([#57](https://github.com/black-atom-industries/black-atom/issues/57)).
  - The dev bridge on macOS reads request data that arrives after the connection is accepted, instead of failing the request ([#10](https://github.com/black-atom-industries/black-atom/issues/10)).

---

## `0.9.0` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2026.10.01

### Highlights

#### Black Atom

Black Atom is a family of dark and light themes for developer tools: 32 themes in seven collections, each with its own
palette and mood. Every theme is defined once and rendered for each tool through an adapter, so the same colors show up
in the terminal, the editor, and the rest of the desktop.

#### Seven collections

`default`, `facility`, `terra`, `jpn`, `clay`, `minium`, and `mono`. A theme key names its collection and its
appearance, for example `black-atom-jpn-koyo-dark` or `black-atom-terra-spring-light`.

#### Eleven tools

Adapters for Ghostty, herdr, lazygit, niri, Neovim, Obsidian, tmux, tuicr, Waybar, WezTerm, and Zed. Each adapter's
generated theme files work on their own, so any tool can use Black Atom without livery.

#### Livery

Livery applies one theme across the tools it supports on a machine at once, from a desktop app or the `livery` command.
Run it without a theme to choose one from a fuzzy picker:

```sh
livery apply
```

Livery carries every theme in its binary, switches the macOS or GNOME appearance along with the apps, and remembers the
theme it last applied.
