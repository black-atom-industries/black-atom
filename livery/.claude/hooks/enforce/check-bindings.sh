#!/usr/bin/env bash
# Warn if src/bindings.ts is empty or missing the specta header.
# This happens when a Rust type change causes specta export to panic.

BINDINGS="$(git rev-parse --show-toplevel)/src/bindings.ts"

if [ ! -s "$BINDINGS" ] || ! grep -q "tauri-specta" "$BINDINGS" 2>/dev/null; then
    echo "WARNING: src/bindings.ts is empty or corrupted."
    echo "Run the app (deno task dev) to regenerate specta bindings."
    exit 1
fi
