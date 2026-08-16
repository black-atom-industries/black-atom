---
name: release
description: Cut a livery release. Load when asked to release livery, cut a version, publish a build, or check release-please status.
---

# Release

Livery ships as a Tauri desktop app (`livery-gui`) with a CLI (`livery`). release-please drives
the version from `.github/release-please-config.json` and `.github/.release-please-manifest.json`
(one package at the repo root, one version for everything, tag `v<version>`); a merged release
PR creates the tag. There is no artifact build job yet: the Homebrew cask and Linux artifact are
tracked in a follow-up issue, so a release today is a tag and a changelog.

## Steps

1. Regenerate every adapter and confirm nothing drifts:

   ```bash
   deno task generate
   git status
   ```

   `git status` must come back clean. Generated output is committed, so any diff means a template
   or theme change wasn't regenerated and committed first.

2. Run the full check suite from the repo root:

   ```bash
   deno task check
   deno task test
   cargo clippy --workspace -- -D warnings
   ```

   All three must pass clean before cutting a release.

3. Prove the bundle builds locally:

   ```bash
   cd livery && deno task build
   ```

   This runs the Tauri CLI build. On macOS it produces
   `target/release/bundle/macos/livery.app` at the repo root `target/` (the Cargo workspace root),
   not under `livery/`.

4. release-please opens a release PR against `main` that bumps the version and writes the
   changelog. Review and merge it like any other PR. Never tag by hand, the merge is what creates
   the tag. The `release` workflow also syncs the root `Cargo.lock` on the PR branch.

5. The merge creates tag `v<version>` and a GitHub release. Until
   the artifact job exists, build the bundle locally (step 3) and attach it by hand if a build is
   needed.

## Versions

The repo has one version. release-please bumps every field through `extra-files`:

- `livery/deno.json` (`version`)
- `livery/src-tauri/Cargo.toml` (`package.version`)
- `livery/core/Cargo.toml` (`package.version`)
- `livery/cli/Cargo.toml` (`package.version`)
- `livery/src-tauri/tauri.conf.json` (`version`)
- `core/deno.json` (`version`)
