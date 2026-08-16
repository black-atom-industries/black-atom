# Black Atom for Herdr

> Cohesive Herdr themes generated from the Black Atom theme system.

## About

This repository is the [Herdr](https://herdr.dev/) adapter for
[Black Atom](https://github.com/black-atom-industries/core). It contains committed TOML fragments
for every Black Atom theme.

Herdr does not load dedicated theme files. Its custom colors live in `[theme.custom]` inside
`~/.config/herdr/config.toml`, so each generated file is a complete managed block that can be copied
into that config. [Livery](https://github.com/black-atom-industries/livery) is the recommended way
to download, apply, and switch these fragments safely.

## Collections

| Collection | Themes |
| --- | --- |
| Default | dark, dark dimmed, light, light dimmed |
| JPN | koyo hiru/yoru, tsuki yoru, murasaki yoru |
| Stations | engineering, operations, medical, research |
| Terra | spring, summer, fall, winter — day and night |
| MNML | clay, orange, osman, mikado, 47, eink, mono, ita variants |
| Paper | brown and blue — light and dark |

Generated files live at `themes/<collection>/<theme-key>.toml`.

## Usage

### Livery (recommended)

1. Open Livery settings and enable the Herdr adapter.
2. Set `CONFIG_PATH` to `~/.config/herdr/config.toml` and sync themes.
3. Pick any Black Atom theme in Livery.

Livery replaces only the block between these markers and then runs
`herdr server reload-config`:

```toml
# BEGIN BLACK ATOM LIVERY THEME
# ...generated [theme] and [theme.custom] tables...
# END BLACK ATOM LIVERY THEME
```

If the config already has an unmanaged `[theme]` or `[theme.custom]` table, wrap that theme stanza
with the markers before the first Livery apply. Livery refuses ambiguous marker states rather than
risking unrelated config.

### Manual

Copy one generated file's complete managed block into `~/.config/herdr/config.toml`, replacing the
previous marked block, then reload:

```sh
herdr server reload-config
```

Herdr custom colors are global. Do not enable Herdr's own light/dark theme auto-switch for this
block; switch complete Black Atom variants through Livery instead.

## Development

Requirements: [Deno](https://deno.com/) and Black Atom Core.

```sh
deno task generate  # regenerate committed TOML files
deno task dev       # regenerate on template changes
deno task update    # refresh the cached core CLI
```

Templates use Eta syntax and semantic Black Atom colors only. `surface_dim` uses `ui.bg.panel`, and
`surface1` is a small blend from `ui.bg.active` toward `ui.fg.disabled`.

## License

MIT — see [LICENSE](./LICENSE).
