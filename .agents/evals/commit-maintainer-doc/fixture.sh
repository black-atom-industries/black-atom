#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"
sed -i.bak 's/^updaters with a temporary fixture `\$HOME` and XDG directories. Updaters write to config files.$/updaters with a temporary fixture `$HOME` and XDG directories. Updaters write to config files, and\na real `$HOME` loses its configuration on the first apply./' AGENTS.md && rm AGENTS.md.bak
git diff --quiet AGENTS.md && exit 1 || true
