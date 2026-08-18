#!/usr/bin/env bash
# Keep the installed `livery` in sync with the working tree, so testing a
# change never runs yesterday's binary.
#
# `cargo install` builds in release mode, which is slow enough that it only
# runs when the CLI's own sources changed since the last install. The stamp
# is a hash of every file the binary is built from.
#
# Every outcome reports, the skipped one included — a hook that stays quiet
# when it decided to do nothing is indistinguishable from a broken one.

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -d "$ROOT/livery/cli" ] || exit 0

STAMP="$ROOT/target/.livery-cli-installed"

# Cargo.lock pins the dependency versions the binary links against.
sources() {
    find "$ROOT/livery/cli/src" "$ROOT/livery/core/src" -type f -name '*.rs' -print0 2>/dev/null |
        sort -z | xargs -0 shasum 2>/dev/null
    shasum "$ROOT/livery/cli/Cargo.toml" "$ROOT/livery/core/Cargo.toml" "$ROOT/Cargo.lock" 2>/dev/null
}

CURRENT="$(sources | shasum | cut -d' ' -f1)"

failed=""

if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$CURRENT" ] && command -v livery >/dev/null 2>&1; then
    message="🔨 livery · already up to date"
# --locked builds against the pinned Cargo.lock instead of quietly updating
# it, matching the Pi extension in .pi/extensions/install-livery-cli/.
elif cargo install --locked --path "$ROOT/livery/cli" --force --quiet 2>/dev/null; then
    mkdir -p "$(dirname "$STAMP")"
    printf '%s' "$CURRENT" > "$STAMP"
    message="🔨 livery · reinstalled from the working tree"
else
    message="⚠️  livery · install FAILED — run: cargo install --locked --path livery/cli --force"
    failed="yes"
fi

# `systemMessage` reaches the model but never the terminal, so the line the
# user actually reads goes to stderr.
echo "$message" >&2

python3 -c '
import json, sys
message, failed = sys.argv[1], sys.argv[2]
payload = {"systemMessage": message}
if failed:
    payload["hookSpecificOutput"] = {
        "hookEventName": "Stop",
        "additionalContext": message,
    }
print(json.dumps(payload))' "$message" "$failed"
