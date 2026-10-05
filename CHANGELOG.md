# Changelog

## [Unreleased]

### Added

- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - A collection's `template` in `black-atom-adapter.json` accepts a list, and each template renders one file per theme.

### Changed

- Themes — nbr <nikolaus.brunner@protonmail.ch> ([#54](https://github.com/black-atom-industries/black-atom/issues/54))
  - Default Light and Dimmed Light use more saturated accents and feedback colors, and Dimmed Light has lighter surfaces.
  - Diff and feedback backgrounds in the default themes use a subtler tint.
  - Comments in Default Dark and Dimmed Dark are brighter.
- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - tuicr tints highlighted code in added and deleted lines with 30% of the diff background, so the gutter keeps the full color.
- Livery — nbr <nikolaus.brunner@protonmail.ch>
  - The theme list shows five color pips per theme: its background, its accents, then palette colors.

### Fixed

- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - tuicr themes highlight code with Black Atom syntax colors from a generated `.tmTheme` instead of tuicr's bundled base16 theme.
- Livery — nbr <nikolaus.brunner@protonmail.ch>
  - The tuicr setup links each theme's `.tmTheme` next to its `.toml`.
  - A tuicr setup without the `.tmTheme` links shows as unlinked until SET UP runs again.
- Development — nbr <nikolaus.brunner@protonmail.ch>
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
