---
name: repo-release
description:
  "Prepare and ship a Black Atom release. Use this when cutting a version, preparing release notes, or merging the
  release-please PR. Ask for approval before merging the release PR."
argument-hint: "[version, for example 0.7.0; defaults to the release PR's version]"
allowed-tools: Bash Read Edit
---

# Release Black Atom

Follow [`docs/releases.md`](../../../docs/releases.md). It is the maintainer source of truth for the release PR, the curated
release section, and checking the GitHub Release.

Read the version from the release PR title after release-please has finished its run for the latest push to `main`; each
run can change the version. Curate the section on the release branch with [`repo-changelog`](../repo-changelog/SKILL.md).

Regenerate every adapter with `npm run generate` and confirm `git status` is clean. Generated output is committed, so a
diff means a template or theme change went in without its output. Then prove the release build with `npm run build`.

Nothing lands on `main` between curating and merging. Ask for explicit approval immediately before merging the release PR.
