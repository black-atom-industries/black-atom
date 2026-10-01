#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"
f=core/src/themes/catalog.ts
orig="$(mktemp)"
cp "$f" "$orig"
sed -i.bak -E 's/^    /  /' "$f" && rm "$f.bak"
git commit -qam "refactor(core): tidy the catalog"
cp "$orig" "$f"
git diff --quiet && exit 1 || true
