#!/usr/bin/env bash
# Enforce: no direct FS access from TypeScript
# All file I/O must go through Rust commands (invoke("replace_in_file"), etc.)

if grep -r "@tauri-apps/plugin-fs" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules; then
    echo "ERROR: Direct @tauri-apps/plugin-fs import found in src/"
    echo "All file I/O must go through Rust commands. Use invoke(\"replace_in_file\") instead."
    exit 1
fi
