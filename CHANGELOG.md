# Changelog

## [Unreleased]

### Added

- Adapters — nbr <nikolaus.brunner@protonmail.ch>
  - A collection's `template` in `black-atom-adapter.json` accepts a list, and each template renders one file per theme.

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
