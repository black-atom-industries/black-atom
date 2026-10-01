#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"
cat > CHANGELOG.md <<'MD'
# Changelog

## [Unreleased]

### Added

- Adapters — Eval User <eval@example.com>
  - A tuicr adapter ships themes for every collection.
- Livery CLI — Eval User <eval@example.com>
  - `livery apply` without a theme opens an interactive picker.
  - `livery setup` finds Obsidian vaults and links their theme folders.

### Changed

- Themes — Eval User <eval@example.com>
  - The facility dark themes use darker backgrounds and a lighter lime accent.
  - The facility light themes follow the dark rework.
- Livery — Eval User <eval@example.com>
  - Themes ship inside the livery binary and unpack under the XDG data directory.
  - The config file moves under the XDG config directory.

### Fixed

- Adapters — Eval User <eval@example.com>
  - Ghostty uses the accent as the cursor color.
MD
git commit -qam "docs: log the unreleased changes"
