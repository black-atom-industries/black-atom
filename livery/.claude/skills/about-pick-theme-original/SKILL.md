---
name: about:pick-theme-original
description: Reference for the original pick-theme bash script from dots. Load when implementing livery updaters to understand the existing behavior being migrated.
user-invocable: false
---

# Original pick-theme Implementation

The original theme picker is a bash script at
`~/repos/nikbrunner/dots/common/.local/bin/pick-theme`. Livery is replacing this with a Tauri
desktop app. This skill documents the original behavior as a migration reference.

## Source Files

- **pick-theme**: `~/repos/nikbrunner/dots/common/.local/bin/pick-theme`
- **ghostty-reload**: `~/repos/nikbrunner/dots/common/.local/bin/ghostty-reload`

## Flow

1. Read current theme from nvim config (`colorscheme = "..."`)
2. Read current mode from macOS system appearance
3. Present themes via fzf
4. On selection, `apply_theme()` runs all updaters sequentially
5. After config file updates, reload running tools
6. Restart neovim instances via tmux

## Updaters (in execution order)

### 1. nvim

- **File**: `$DOTS_DIR/common/.config/nvim/lua/config.lua`
- **Action**: `sed` replace `colorscheme = .*` with new theme name
- **Reload**: Restart all nvim instances in tmux panes via `tmux send-keys :restart Enter`
- **Note**: Uses tmux to find nvim panes, sends Escape first, then `:restart`. Sleeps 0.2s between.

### 2. tmux

- **File**: `$DOTS_DIR/common/.config/tmux/tmux.conf`
- **Action**: `sed` replace `source-file .*/black-atom-industries/tmux/themes/...` path
- **Needs**: theme name + collection name to build path
- **Path pattern**: `~/repos/black-atom-industries/tmux/themes/$collection/${theme}.conf`
- **Reload**: `tmux source-file "$TMUX_CONFIG"`

### 3. ghostty

- **File**: `$DOTS_DIR/common/.config/ghostty/config`
- **Action**: `sed` replace `^theme = .*` with `theme = ${theme}.conf`
- **Reload**: `pkill -SIGUSR2 ghostty` (requires Ghostty 1.2.0+)
- **Fallback**: AppleScript to click "Reload Configuration" menu item on macOS
- **Note**: Terminal escape sequences suppressed during reload (`stty -echo`)

### 4. zed

- **File**: `$DOTS_DIR/common/.config/zed/settings.json`
- **Action**: `jq` to set `.theme.dark` or `.theme.light` based on appearance
- **Needs**: display_name from themes.json (not the theme key)
- **Reload**: Zed auto-watches settings file

### 5. delta

- **File**: `$DOTS_DIR/common/.gitconfig`
- **Action**: Toggle comments on `dark = true` / `light = true` lines
- **Needs**: appearance (dark/light), not theme name
- **Reload**: None needed

### 6. niri (Linux only)

- **Action**: Symlink theme kdl file
- **Path**: `~/repos/black-atom-industries/niri/themes/$collection/${theme}.kdl`
- **Skipped on macOS**

### 7. waybar (Linux only)

- **Action**: Symlink theme CSS file
- **Reload**: `killall -SIGUSR2 waybar`
- **Skipped on macOS**

### 8. lazygit

- **File**: `$DOTS_DIR/common/.config/lazygit/config.yml`
- **Action**: `yq` to merge theme YAML into config
- **Needs**: yq installed

### 9. helm

- **File**: `~/.config/helm/config.yml`
- **Action**: `yq` to set `.appearance` to dark/light
- **Needs**: yq installed

### 10. macOS system appearance

- **Action**: `osascript` to toggle dark mode
- **macOS only**

## Execution Order

1. Update all config files (sequential)
2. `stty -echo` (suppress ghostty escape sequences)
3. `sleep 0.3`
4. Reload: tmux, ghostty, waybar
5. `sleep 0.3`
6. `stty echo`
7. Restart neovim instances

## Key Data

- **Theme metadata**: appearance (dark/light) and collection come from `themes.json`
- **Display name**: Used by Zed (different from theme key)
- **Collection**: Used by tmux and niri to build file paths
- All paths use `$DOTS_DIR` as base, with tilde expansion for tmux theme paths

## Important Patterns

- macOS vs Linux `sed -i` difference (macOS needs `''` after `-i`)
- Ghostty reload has SIGUSR2 + AppleScript fallback
- Neovim restart is tmux-dependent (finds panes running nvim)
- Some updaters need the theme key, others need appearance, others need display_name
- `sleep` delays between file writes and reloads to let changes settle
