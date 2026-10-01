# Black Atom for tuicr

> Cohesive tuicr themes generated from the Black Atom theme system.

## About

This directory is the [tuicr](https://github.com/agavra/tuicr) adapter for Black Atom. It contains
committed local theme files for every Black Atom theme.

## Collections

32 themes across seven collections:

| Collection   | Themes                                                 |
| ------------ | ------------------------------------------------------ |
| **Default**  | dark, dimmed-dark, light, dimmed-light                 |
| **Facility** | dark, dimmed-dark, light, dimmed-light                 |
| **Terra**    | spring, summer, fall, winter (dark/light)              |
| **JPN**      | koyo, sanshoku (dark/light), murasaki-dark, tsuki-dark |
| **Clay**     | dark, light                                            |
| **Minium**   | polymer, viridian (dark/light)                         |
| **Mono**     | dark, dimmed-dark, light, dimmed-light                 |

Generated files live at `themes/<collection>/<theme-key>.toml`.

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
cp themes/*/*.toml ~/.config/tuicr/themes/
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

The files set no `syntax_theme`, so tuicr highlights code with its bundled dark or light syntax
theme, chosen from the theme background.

## Development

Requirements: [Deno](https://deno.com/).

```sh
deno run -A ../../core/src/cli/index.ts generate  # regenerate committed TOML files
deno run -A ../../core/src/cli/index.ts generate --watch       # regenerate on template changes
```

Templates use Eta syntax and semantic Black Atom colors only. One shared template covers every
collection.

## License

MIT, see [LICENSE](./LICENSE).
