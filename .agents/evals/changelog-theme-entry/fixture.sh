#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"
sed -i.bak 's/d10: oklch(0.12,/d10: oklch(0.15,/' core/src/themes/facility/black-atom-facility-dark.ts
sed -i.bak 's/d10: oklch(0.2,/d10: oklch(0.23,/; s/d10: oklch(0.20,/d10: oklch(0.23,/' core/src/themes/facility/black-atom-facility-dimmed-dark.ts
rm core/src/themes/facility/*.bak
git diff --quiet && exit 1 || true
