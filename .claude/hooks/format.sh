#!/usr/bin/env bash
# Format the file a Write or Edit just changed. Claude Code passes the tool call as JSON on stdin.

FILE="$(node -e 'let s = ""; process.stdin.on("data", (c) => (s += c)).on("end", () => console.log(JSON.parse(s).tool_input?.file_path ?? ""))')"
[ -n "$FILE" ] || exit 0

ROOT="$(git rev-parse --show-toplevel)"
"$ROOT/node_modules/.bin/oxfmt" --no-error-on-unmatched-pattern "$FILE" >/dev/null 2>&1
case "$FILE" in
    */livery/core/* | */livery/cli/* | */livery/src-tauri/*) cargo fmt --all 2>/dev/null ;;
esac
exit 0
