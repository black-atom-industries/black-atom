#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"

remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git push -q origin main

git checkout -q -b release-please--branches--main
section="$(mktemp)"
cat > "$section" <<'MD'
## [0.11.0](https://github.com/black-atom-industries/black-atom/compare/v0.10.0...v0.11.0) (2026-10-12)

### Features

* **kagi:** add a theme picker to the Kagi adapter ([1a2b3c4](https://github.com/black-atom-industries/black-atom/commit/1a2b3c4))
* **livery:** apply delta themes from the desktop app ([5d6e7f8](https://github.com/black-atom-industries/black-atom/commit/5d6e7f8))
* **core:** accept a list of templates per collection ([9a0b1c2](https://github.com/black-atom-industries/black-atom/commit/9a0b1c2))

### Bug Fixes

* **tuicr:** keep the panel background on the main surface ([3c4d5e6](https://github.com/black-atom-industries/black-atom/commit/3c4d5e6))
* **livery:** list update notes below the apply results ([7f8a9b0](https://github.com/black-atom-industries/black-atom/commit/7f8a9b0))

MD
{ head -n 2 CHANGELOG.md; cat "$section"; tail -n +3 CHANGELOG.md; } > CHANGELOG.new
mv CHANGELOG.new CHANGELOG.md
git commit -qam "chore(main): release 0.11.0"
git push -q origin release-please--branches--main
git checkout -q main

stub_dir=.gh-stub
mkdir -p bin "$stub_dir"
cp "$(dirname "$0")/stubs/gh" bin/gh
chmod +x bin/gh
printf 'bin/\n.gh-stub/\n' >> .git/info/exclude

{
  printf '> :robot: I have created a release *beep* *boop*\n---\n'
  cat "$section"
  printf -- '---\nThis PR was generated with Release Please. See documentation at https://github.com/googleapis/release-please#release-please.\n'
} > "$stub_dir/pr-body.md"
python3 -c '
import json, sys
body = open(sys.argv[1]).read()
print(json.dumps({"number": 15, "title": "chore(main): release 0.11.0", "headRefName": "release-please--branches--main", "body": body}))
' "$stub_dir/pr-body.md" > "$stub_dir/pr-view.json"
rm -f "$section"
