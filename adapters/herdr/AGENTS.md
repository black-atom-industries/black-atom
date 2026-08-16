# Black Atom Herdr Adapter

This repository generates Herdr TOML theme fragments from Black Atom Core.

## Commands

```sh
deno task generate
deno task dev
```

## Rules

- Edit `themes/collection.template.toml`, then regenerate committed outputs.
- Generated outputs live under `themes/<collection>/`.
- Use `theme.ui`, `theme.palette`, or `theme.syntax`; never access `theme.primaries` or
  `theme.accents` directly.
- Every generated file must retain exactly one `BEGIN BLACK ATOM LIVERY THEME` / `END BLACK ATOM
  LIVERY THEME` marker pair, `[theme]`, `[theme.custom]`, and all 16 Herdr custom color fields.
- Herdr cannot include these files directly. Livery consumes them as a Merged adapter.
