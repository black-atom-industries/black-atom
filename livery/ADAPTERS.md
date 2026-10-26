# ADAPTERS

How each supported app gets its Black Atom themes, what livery automates, and what stays yours.

## Theme Provisioning

Livery ships every adapter's generated theme output in its binary and unpacks it into the **managed
themes directory** (`$XDG_DATA_HOME/black-atom/themes/<adapter>/`, falling back to
`~/.local/share`). What happens next depends on one question — **who consumes those files** — and
every adapter falls into exactly one class:

| Class        | Adapters                                         | Definition                                                                                                                                                                       |
| ------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **External** | helm-tmux                                        | The app's theme files are provided outside of livery — by a compiled binary — so livery only performs switching.                                                                 |
| **Linked**   | ghostty, zed, tmux, delta, obsidian, nvim, tuicr | Livery symlinks the managed theme files into a location the app itself reads, and switching selects one via a pointer in the app's config — a pointer the user adds once.        |
| **Merged**   | lazygit, herdr, claude-code                      | The app cannot read the managed theme files where they are, so on every switch livery reads the managed theme and writes it into the app's config or a theme file the app reads. |

Two per-adapter properties are deliberately **not** classes:

- **Setup precondition** — a one-time manual step livery cannot automate (tell livery which config folders to manage). Orthogonal to who consumes the files.
- **Switch pointer** — the config line or property that selects the active theme. Every adapter has
  one; livery's apply step rewrites it and never adds it, so an apply fails until the pointer exists.

In the settings screen, **AUTO-DETECT** checks which apps exist (conservatively: does the configured
config file exist?), and **SET UP** runs the class-appropriate chain — enable → link (Linked only) →
verify — always ending with verification, so the row reflects the true state.

## Per-adapter contracts

### ghostty — Linked

- **Files:** flat symlinks in `~/.config/ghostty/themes/` → managed dir. Ghostty looks themes up by
  bare name in its own themes dir (it rejects `~` paths in `theme =`).
- **Switch pointer:** `theme = <themeKey>.conf` in `~/.config/ghostty/config`.
- **Reload:** SIGUSR2.
- **Precondition:** a `theme = ...` line in the config (any value).

### zed — Linked

- **Files:** flat symlinks in `~/.config/zed/themes/` → managed dir. Zed cannot load themes from
  outside its own themes dir.
- **Switch pointer:** the `"theme"` property in `settings.json` (structural JSONC edit — no regex).
- **Reload:** none needed — zed watches its settings file.
- **Precondition:** a `"theme"` key in `settings.json`, either a string or an object with `dark` and `light`.

### tmux — Linked

- **Files:** flat symlinks in `~/.config/tmux/themes/` → managed dir. Tmux has no theme discovery of
  its own — the symlink farm keeps the pointer app-local instead of referencing livery internals.
  Theme keys are globally unique, so flattening collections loses nothing.
- **Switch pointer:** `source-file ~/.config/tmux/themes/<themeKey>.conf` in `tmux.conf` — add it
  once; livery rewrites it per switch.
- **Reload:** `tmux source-file`.
- **Precondition:** the `source-file` line must exist (any theme path matching the pattern).

### delta — Linked

- **Files:** flat symlinks in `~/.config/delta/themes/` → managed dir. Each file sets delta's
  `[delta]` section: appearance, diff and line-number styles, and `syntax-theme = ansi`.
- **Switch pointer:** `path = ~/.config/delta/themes/<themeKey>.gitconfig` under `[include]` in
  `~/.gitconfig.delta`, which `.gitconfig` includes. Put the include before your own `[delta]`
  section so your settings win.
- **Reload:** none needed — delta reads git config on every run.
- **Precondition:** the include `path` line must exist (any Black Atom theme path).

### tuicr — Linked

- **Files:** flat symlinks in `~/.config/tuicr/themes/` → managed dir, one per `.toml` theme and
  one per `.tmTheme` syntax theme. tuicr looks local themes up by bare name in its own themes dir and
  resolves `syntax_theme` next to the link
  ([agavra/tuicr#749](https://github.com/agavra/tuicr/issues/749)).
- **Switch pointer:** `theme = "<themeKey>"` in `~/.config/tuicr/config.toml`. It takes precedence
  over `theme_dark`, `theme_light`, and `appearance`.
- **Reload:** none — tuicr reads its theme on start.
- **Precondition:** the `theme = "..."` line must exist (any value, bundled names included).

### obsidian — Linked

- **Files:** the managed dir carries the per-theme CSS under
  `<managed>/obsidian/<collection>/black-atom-*.css` alongside the merged `theme.css` +
  `manifest.json` pair. Only that pair is symlinked into `<config-folder>/themes/Black Atom/` —
  Obsidian discovers themes as per-name subdirectories of the config folder's themes dir. Black Atom ships
  as ONE theme; collections/variants switch via the Style Settings plugin values.
- **Switch pointer:** `cssTheme` in `appearance.json` + the variant key in the Style Settings plugin
  data.
- **Variant:** set only when the Style Settings plugin's `data.json` exists in the folder.
- **Reload:** `obsidian vault=<id> reload` through the `obsidian` command, when Obsidian is running. The ID comes from Obsidian's vault registry, so vaults with the same folder name stay apart.
  Skipped when two vaults share a name; deferred to the next launch when Obsidian is not running.
- **Precondition:** none for vaults in Obsidian's registry (`obsidian.json`): setup discovers their
  configuration folders. Add any other folder, such as a renamed override folder, by hand. Livery
  applies the theme to every configured folder that has an `appearance.json`.

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
- **Switch pointer:** the complete managed block, the `[theme.custom]` color table. If no markers or theme table exist, livery can append it; ambiguous markers or an
  unmanaged theme table fail safely without writing.
- **Reload:** `herdr server reload-config` over every running Herdr session socket. With no running
  session, the valid config applies on next launch; partial reload failures produce a degraded
  apply.
- **Precondition:** existing `[theme]` / `[theme.custom]` tables must be wrapped in
  `# BEGIN BLACK ATOM LIVERY THEME` and `# END BLACK ATOM LIVERY THEME` markers before first apply.

### claude-code — Merged

- **Files:** consumed by livery itself — on every switch it copies
  `<managed>/claude-code/<collection>/<themeKey>.json` to `themes/black-atom.json` in each
  configured config folder. A config folder is a Claude Code config directory such as `~/.claude`
  or a `CLAUDE_CONFIG_DIR` profile like `~/.claude-work`. The folder is used as configured, so a
  `settings.json` symlinked into a dotfiles repo leaves the theme file in the config folder.
- **Discovery:** setup finds every `~/.claude*` directory that holds a `settings.json`. Add any
  other folder by hand in the settings page or when `livery setup` asks.
- **Switch pointer:** `"theme": "custom:black-atom"` in each folder's `settings.json`. The theme
  name is fixed, so the pointer never changes and livery never writes `settings.json`. Livery
  writes the theme file even without the pointer and reports the apply as degraded; selecting the
  Black Atom theme in `/theme` then sets the pointer.
- **Reload:** none needed — Claude Code watches its `themes/` dir. If that dir did not exist when
  Claude Code started, it picks up the theme after one restart.
- **Precondition:** select the Black Atom theme in `/theme` once per config folder after the
  first apply. That sets the switch pointer. Every config folder must hold a `settings.json`;
  livery writes no theme into a folder without one.

### nvim — Linked

- **Files:** the colorschemes in `colors/` plus the runtime under `lua/black-atom/`, both unpacked
  into the managed themes dir.
- **Placement:** one directory symlink,
  `$XDG_DATA_HOME/nvim/site/pack/black-atom/start/black-atom` → the managed `nvim` dir. Neovim puts
  `pack/*/start/*` on the runtimepath itself, so no plugin manager is involved.
- **Switch pointer:** a `colorscheme = "<themeKey>"` assignment in `config_path` (default
  `~/.config/nvim/lua/config.lua`). A `vim.cmd.colorscheme(...)` call does not match.
- **Reload:** `nvim --server <socket> --remote-expr` against every running instance whose socket lives
  under `$TMPDIR/nvim.<user>/`, which covers macOS. Sockets under `$XDG_RUNTIME_DIR` on Linux are not
  found yet.
- **Precondition:** the `colorscheme = "..."` line must exist (any value).
- **Plugin options:** the settings page writes `vim.g.black_atom_core_config` into a managed block
  in `settings_path` (default `~/.config/nvim/init.lua`), between
  `-- BEGIN BLACK ATOM LIVERY CONFIG` and `-- END BLACK ATOM LIVERY CONFIG`. The file must already
  exist; Livery patches a Neovim entry point, it never creates one. Options are stored in
  `apps.nvim.settings` and the block is their projection, so config stays the source of truth.
  The plugin deep-merges the block over its own defaults, so a flag is only written when the
  plugin's defaults declare it or the user turned it on — writing `bold = false` unasked would
  strip the hardcoded bold on `@function.call` and `@method.call`. New options land after a Neovim
  restart.

### helm-tmux — External

- **Files:** compiled into the Helm binary — nothing to install.
- **Switch pointer:** `theme: <themeKey>` in `~/.config/black-atom/helm-tmux/config.yml`.

## Not switched by livery

Livery ships these adapters' generated files in its binary but has no updater for them yet
([#5](https://github.com/black-atom-industries/black-atom/issues/5)). Wire them up by hand as each adapter's README
describes; the theme stays fixed until you change it.

- **kagi** — paste a theme file into Kagi's Custom CSS setting
  ([`adapters/kagi`](../adapters/kagi)). The setting lives in the Kagi account and Kagi's API cannot
  write it, so livery has no way to switch it. `livery adapter kagi` copies a theme file to the
  clipboard.
- **niri** — `include` a theme file from the niri config ([`adapters/niri`](../adapters/niri)).
- **waybar** — `@import` a theme's color definitions in `style.css`
  ([`adapters/waybar`](../adapters/waybar)).
- **wezterm** — copy the color schemes into WezTerm's config directory and set `color_scheme`
  ([`adapters/wezterm`](../adapters/wezterm)).

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
