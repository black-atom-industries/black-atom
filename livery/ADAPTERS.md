# ADAPTERS

How each supported app gets its Black Atom themes, what livery automates, and what stays yours.

## Theme Provisioning

Livery ships every adapter's generated theme output in its binary and unpacks it into the **managed
themes directory** (`$XDG_DATA_HOME/black-atom/themes/<adapter>/`, falling back to
`~/.local/share`). What happens next depends on one question — **who consumes those files** — and
every adapter falls into exactly one class:

| Class        | Adapters                           | Definition                                                                                                                                                                |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **External** | helm-tmux, delta                   | The app's theme files are provided outside of livery — by a compiled binary or the user — so livery only performs switching.                                              |
| **Linked**   | ghostty, zed, tmux, obsidian, nvim | Livery symlinks the managed theme files into a location the app itself reads, and switching selects one via a pointer in the app's config — a pointer setup may add once. |
| **Merged**   | lazygit, herdr                     | The app cannot read external theme files, so on every switch livery reads the managed theme and writes its values directly into the app's config.                         |

Two per-adapter properties are deliberately **not** classes:

- **Setup precondition** — a one-time manual step livery cannot automate (tell livery which obsidian
  vault). Orthogonal to who consumes the files.
- **Switch pointer** — the config line or property that selects the active theme. Every adapter has
  one; livery's apply step rewrites it.

In the settings screen, **AUTO-DETECT** checks which apps exist (conservatively: does the configured
config file exist?), and **SET UP** runs the class-appropriate chain — enable → link (Linked only) →
verify — always ending with verification, so the row reflects the true state.

## Per-adapter contracts

### ghostty — Linked

- **Files:** flat symlinks in `~/.config/ghostty/themes/` → managed dir. Ghostty looks themes up by
  bare name in its own themes dir (it rejects `~` paths in `theme =`).
- **Switch pointer:** `theme = <themeKey>.conf` in `~/.config/ghostty/config`.
- **Reload:** SIGUSR2.
- **Precondition:** none. SET UP is fully automatic.

### zed — Linked

- **Files:** flat symlinks in `~/.config/zed/themes/` → managed dir. Zed cannot load themes from
  outside its own themes dir.
- **Switch pointer:** the `"theme"` property in `settings.json` (structural JSONC edit — no regex).
- **Reload:** none needed — zed watches its settings file.
- **Precondition:** none.

### tmux — Linked

- **Files:** flat symlinks in `~/.config/tmux/themes/` → managed dir. Tmux has no theme discovery of
  its own — the symlink farm keeps the pointer app-local instead of referencing livery internals.
  Theme keys are globally unique, so flattening collections loses nothing.
- **Switch pointer:** `source-file ~/.config/tmux/themes/<themeKey>.conf` in `tmux.conf` — add it
  once; livery rewrites it per switch.
- **Reload:** `tmux source-file`.
- **Precondition:** the `source-file` line must exist (any theme path matching the pattern).

### obsidian — Linked

- **Files:** the managed dir carries the per-theme CSS under
  `<managed>/obsidian/<collection>/black-atom-*.css` alongside the merged `theme.css` +
  `manifest.json` pair. Only that pair is symlinked into `<vault>/.obsidian/themes/Black Atom/` —
  Obsidian discovers themes as per-name subdirectories of the vault's themes dir. Black Atom ships
  as ONE theme; collections/variants switch via the Style Settings plugin values.
- **Switch pointer:** `cssTheme` in `appearance.json` + the variant key in the Style Settings plugin
  data.
- **Reload:** `obsidian://` URI.
- **Precondition:** point CONFIG_PATH at your vault's `.obsidian/appearance.json` — livery cannot
  guess which vault. Multi-vault support is tracked in issue #47.

### lazygit — Merged

- **Files:** consumed by livery itself — on every switch it reads
  `<managed>/lazygit/<collection>/<themeKey>.yml` and merges the values into `config.yml` (lossless
  YAML merge, comments preserved). Lazygit never reads the managed dir.
- **Switch pointer:** the `gui.theme` values themselves.
- **Reload:** none (picked up on next lazygit start).
- **Precondition:** none.

### herdr — Merged

- **Files:** consumed by livery itself — on every switch it reads
  `<managed>/herdr/<collection>/<themeKey>.toml` and replaces the block between the Black Atom
  Livery markers in `~/.config/herdr/config.toml`. Herdr never reads the managed dir.
- **Switch pointer:** the complete managed `[theme]` + `[theme.custom]` block. If no markers or
  theme table exist, livery can append it; ambiguous markers or an unmanaged theme table fail safely
  without writing.
- **Reload:** `herdr server reload-config` over every running Herdr session socket. With no running
  session, the valid config applies on next launch; partial reload failures produce a degraded
  apply.
- **Precondition:** existing `[theme]` / `[theme.custom]` tables must be wrapped in
  `# BEGIN BLACK ATOM LIVERY THEME` and `# END BLACK ATOM LIVERY THEME` markers before first apply.

### nvim — Linked

- **Files:** the colorschemes in `colors/` plus the runtime under `lua/black-atom/`, both unpacked
  into the managed themes dir.
- **Placement:** one directory symlink,
  `$XDG_DATA_HOME/nvim/site/pack/black-atom/start/black-atom` → the managed `nvim` dir. Neovim puts
  `pack/*/start/*` on the runtimepath itself, so no plugin manager is involved.
- **Switch pointer:** a `colorscheme = "<themeKey>"` (or `vim.cmd.colorscheme(...)`) line in your
  config.
- **Reload:** `nvim --server <socket> --remote-expr` against every running instance.

### helm-tmux — External

- **Files:** compiled into the Helm binary — nothing to install.
- **Switch pointer:** `theme: <themeKey>` in `~/.config/black-atom/helm-tmux/config.yml`.

### delta — External

- **Files:** user-owned — maintain your `~/.gitconfig.delta` with `black-atom-dark` /
  `black-atom-light` feature blocks, included from `.gitconfig`.
- **Switch pointer:** `features = black-atom-<appearance>`.

## Future directions

- **Ghostty include file** — ghostty supports `config-file = ?<path>` optional includes (the `?`
  makes a missing file a no-op). Livery could own an included theme file outright and never
  regex-patch the user's config again.
- **Current-theme symlink** — generalize that idea: a stable `current` symlink per adapter that
  livery re-points on switch, so the switch pointer is written exactly once at setup and config
  patching disappears from the apply path entirely.
- **Adapter-declared metadata** — the provisioning class and setup contract belong in each adapter
  repo's `black-atom-adapter.json` (core schema addition); livery's registry carries the knowledge
  until then.
