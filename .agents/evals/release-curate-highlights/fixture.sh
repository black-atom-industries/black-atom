#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/../_shared/workspace.sh"

remote="$PWD/.git/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"

edit() {
  python3 - "$@" <<'PY'
import sys
from pathlib import Path
path, old, new = sys.argv[1:4]
p = Path(path)
s = p.read_text()
assert old in s, (path, old)
p.write_text(s.replace(old, new, 1))
PY
}
ln -s "$root/node_modules" node_modules
printf 'node_modules\n' >> .git/info/exclude
commit() {
  node core/src/tasks/generate.ts >/dev/null
  git add -A
  git commit -q -m "$1"
  git rev-parse --short=7 HEAD
}
edit adapters/kagi/styles/base.css "    --ba-case: uppercase;
" "    --ba-case: uppercase;
    --ba-nav-tracking: 0.04em;
"
edit adapters/kagi/styles/base.css ".serp-nav .nav_item {
    text-transform: var(--ba-case);
" ".serp-nav .nav_item {
    text-transform: var(--ba-case);
    letter-spacing: var(--ba-nav-tracking);
"
tracking=$(commit "feat(kagi): add a letter-spacing knob for the search navigation")
edit adapters/tuicr/themes/collection.template.toml 'diff_context = "<%= theme.ui.fg.default %>"' 'diff_context = "<%= theme.ui.fg.subtle %>"'
context=$(commit "feat(tuicr): show diff context lines in the subtle foreground")
git push -q origin main

link() { printf '[%s](https://github.com/black-atom-industries/black-atom/commit/%s)' "$1" "$1"; }

git checkout -q -b release-please--branches--main
section="$(mktemp)"
cat > "$section" <<MD
## [0.11.0](https://github.com/black-atom-industries/black-atom/compare/v0.10.0...v0.11.0) (2026-10-12)


### Features

* **kagi:** add a letter-spacing knob for the search navigation ($(link "$tracking"))
* **tuicr:** show diff context lines in the subtle foreground ($(link "$context"))

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
  printf ':robot: I have created a release *beep* *boop*\n---\n\n\n'
  cat "$section"
  printf -- '---\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).\n'
} > "$stub_dir/pr-body.md"
python3 -c '
import json, sys
body = open(sys.argv[1]).read()
print(json.dumps({"number": 15, "title": "chore(main): release 0.11.0", "headRefName": "release-please--branches--main", "body": body}))
' "$stub_dir/pr-body.md" > "$stub_dir/pr-view.json"
rm -f "$section"
