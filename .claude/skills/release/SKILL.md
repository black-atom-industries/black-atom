---
name: release
description: Cut a livery release. Load when asked to release livery, cut a version, publish a build, or check release-please status.
---

# Release

Livery ships as a Tauri desktop app. release-please drives the version, a merged PR tags the
release, and CI builds the artifacts.

## Phase 5 status

Root `release-please-config.json` and `.release-please-manifest.json` arrive with Phase 5 of the
migration and do not exist yet. Until then there is no automated release PR and no release
workflow. Run the steps below as the local proof a release will pass; stop before the
release-please and GitHub release steps, and flag that Phase 5 is not done.

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

4. Once Phase 5 lands, release-please opens a release PR against `main` that bumps the version.
   Review and merge it like any other PR. Never tag by hand, the merge is what creates the tag.

5. The merge creates tag `livery-v<version>` and the release workflow builds a macOS `.dmg` and a
   Linux artifact from that tag, attaching both to the GitHub release.

6. After the workflow finishes, open the GitHub release page and confirm both the `.dmg` and the
   Linux artifact are attached before telling anyone the release is out.

## Versions

Three files carry a version number:

- `livery/deno.json` (`version`)
- `livery/src-tauri/Cargo.toml` (`package.version`)
- `livery/src-tauri/tauri.conf.json` (`version`)

release-please bumps `livery/deno.json` and `livery/src-tauri/Cargo.toml` together through its
`extra-files` config once Phase 5 lands. `tauri.conf.json` is not wired into that list, check it
manually against the other two before a release; it can drift out of sync otherwise.
