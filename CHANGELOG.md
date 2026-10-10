# Changelog

## [0.10.0](https://github.com/black-atom-industries/black-atom/compare/v0.9.0...v0.10.0) (2026-10-10)


### ⚠ BREAKING CHANGES

* **livery:** delta switches themes through `path = <themes>/<themeKey>.gitconfig` under [include] in ~/.gitconfig.delta. The features line and the black-atom-dark/light blocks go unused.

### Features

* **core:** accept a list of templates per collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([d2a94b0](https://github.com/black-atom-industries/black-atom/commit/d2a94b0d5655791c5b066b803c0ff91a27cb0cdc))
* **core:** raise saturation and contrast in the default themes [#54](https://github.com/black-atom-industries/black-atom/issues/54) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([bdc4750](https://github.com/black-atom-industries/black-atom/commit/bdc4750738a60fa5c9b64e3ddf0a0e2bc304637c))
* **delta:** add the delta adapter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([91f47ea](https://github.com/black-atom-industries/black-atom/commit/91f47eaa9e9ef700fb46bc0560188ce6e6f95b39))
* **kagi:** add Kagi Search adapter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([0e5dde5](https://github.com/black-atom-industries/black-atom/commit/0e5dde5770e5dd1b211f4860870461033addbae5))
* keep theme creators inside each collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([acb56c6](https://github.com/black-atom-industries/black-atom/commit/acb56c636891d3832a3e745db1216f62e1ef0593))
* **livery:** copy Kagi themes with livery adapter kagi [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([9e6a90f](https://github.com/black-atom-industries/black-atom/commit/9e6a90fd1120fefd0970664ddf6edfcef61ccc72))
* **livery:** link delta themes and switch them through an include [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([c3a7cba](https://github.com/black-atom-industries/black-atom/commit/c3a7cba992fa2cbdbd891e63a9f368de3568c819))
* **livery:** show theme background and accents in list pips [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([66a686e](https://github.com/black-atom-industries/black-atom/commit/66a686e4a9c55475a3728eeab06e1e90aa6869d4))
* rebuild Minium Polymer from Teenage Engineering colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f3a2a0b](https://github.com/black-atom-industries/black-atom/commit/f3a2a0bfc5430b0b157d9d60b3c6039194f8cffa))
* **tuicr:** use the panel background for the main surface [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([2ec3eea](https://github.com/black-atom-industries/black-atom/commit/2ec3eeae4438482a6734d5f9ade5339c3edb5f6b))


### Bug Fixes

* highlight tuicr code with Black Atom syntax colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([2b9d795](https://github.com/black-atom-industries/black-atom/commit/2b9d795e2f192b0f455847de088ad3bff308ada2))
* **kagi:** keep oxfmt off the base stylesheet [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([ec5fd53](https://github.com/black-atom-industries/black-atom/commit/ec5fd53f09849a1eb790ce86c2103acf1b5fc557))
* keep secrets out of the dev session state [#57](https://github.com/black-atom-industries/black-atom/issues/57) ([3319777](https://github.com/black-atom-industries/black-atom/commit/3319777d5a687bd751815b8cbb02ce6f99f4df09))
* **livery:** keep dev bridge connections blocking on macOS [#10](https://github.com/black-atom-industries/black-atom/issues/10) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([373db41](https://github.com/black-atom-industries/black-atom/commit/373db41827f306d46c9660fb9232d727759ff46b))
* **livery:** list update notes below the apply results [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([8536149](https://github.com/black-atom-industries/black-atom/commit/85361497fe43fd900bdf7ccbc06c0e405f2844a7))
* **livery:** read adapter themes from the working tree in debug builds [#56](https://github.com/black-atom-industries/black-atom/issues/56) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([3b83ca2](https://github.com/black-atom-industries/black-atom/commit/3b83ca2d5d5a76077601855e4c8c3aae4fbee7b9))


### Documentation

* prepare the 0.10.0 release [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([ca8577e](https://github.com/black-atom-industries/black-atom/commit/ca8577ee123c5bc80a703a7d9861722329edccf4))
* split the README into install and usage black-atom-industries/livery[#68](https://github.com/black-atom-industries/black-atom/issues/68) ([23b3480](https://github.com/black-atom-industries/black-atom/commit/23b3480796fd1769e869fb6f0901653157e6eb81))

## 0.9.0 (2026-10-01)

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
