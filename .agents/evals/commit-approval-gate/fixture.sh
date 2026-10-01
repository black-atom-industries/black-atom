#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"
sed -i.bak 's/committed local theme files/comitted local theme files/' adapters/tuicr/README.md && rm adapters/tuicr/README.md.bak
git commit -qam "docs(tuicr): describe the adapter"
sed -i.bak 's/comitted local theme files/committed local theme files/' adapters/tuicr/README.md && rm adapters/tuicr/README.md.bak
printf '\nTODO: rethink the onboarding copy\n' >> livery/PRODUCT.md
printf 'scratch notes\n' > notes.txt
