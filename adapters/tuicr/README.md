# Black Atom for tuicr

> Cohesive tuicr themes generated from the Black Atom theme system.

## About

This directory is the [tuicr](https://github.com/agavra/tuicr) adapter for Black Atom. It contains
committed local theme files for every Black Atom theme, each a `.toml` theme plus the `.tmTheme`
syntax theme it points at.

## Collections

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

Generated files live at `themes/<collection>/<theme-key>.toml` and `themes/<collection>/<theme-key>.tmTheme`.

## Usage

### Livery (recommended)

1. Add a `theme` line to `~/.config/tuicr/config.toml`. Any value works, livery rewrites it:

   ```toml
   theme = "dark"
   ```

2. Open Livery settings, enable the tuicr adapter, and run SET UP. It links every theme into
   `~/.config/tuicr/themes/`.
3. Pick any Black Atom theme in Livery. tuicr picks it up on its next start.

### Manual

tuicr looks up local themes by file name in a flat directory, so copy the files without their
collection folders:

```sh
mkdir -p ~/.config/tuicr/themes
cp themes/*/*.toml themes/*/*.tmTheme ~/.config/tuicr/themes/
```

On Windows the directory is `%APPDATA%\tuicr\themes\`.

Select a theme in `~/.config/tuicr/config.toml`:

```toml
theme = "black-atom-default-dark"
```

or pair a dark and a light theme that follow the system appearance:

```toml
theme_dark = "black-atom-default-dark"
theme_light = "black-atom-default-light"
```

`tuicr --theme black-atom-default-dark` selects one for a single run.

Each theme's `syntax_theme` names the `.tmTheme` with the same key, which carries the Black Atom
syntax colors. tuicr resolves it next to the theme file, so both files go into the same directory.

## Development

Requirements: [Node.js](https://nodejs.org/) 24+.

```sh
node ../../core/src/cli/index.ts generate  # regenerate committed theme files
node ../../core/src/cli/index.ts generate --watch       # regenerate on template changes
```

Templates use Eta syntax and semantic Black Atom colors only. One shared template covers every
collection.

## License

MIT, see [LICENSE](./LICENSE).
