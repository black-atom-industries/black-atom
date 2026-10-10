---
name: repo-commit
description:
    "Prepare a commit in the Black Atom repository. Use this when the user asks to commit, stage, ship, or finish a change. Add
    the changelog entry, stage selectively, run the CI-parity checks, show the exact Conventional Commit, and wait for explicit
    approval."
argument-hint: "[message-hint or scope-hint, optional]"
allowed-tools: Bash Read
---

# Commit a change

This skill replaces any global commit workflow in this repository. Do not commit until the user approves the final message.
Keep unrelated work unstaged. Never bypass hooks with `--no-verify`, stage secrets or credentials, or rewrite history without
explicit approval. Keep each commit atomic.

## 1. Survey the tree

Run:

```sh
git status --short
git diff --stat
git diff --cached --stat
git log --oneline -5
```

Classify paths as **in scope**, **held back**, or **stray**. Surface unexpected edits and never hide them with reset,
restore, or clean.

## 2. Verify the changelog entry

The change already carries its user-facing line under `CHANGELOG.md`; `repo-changelog` writes it as part of every
implementation. Confirm it is present, accurate, and under the correct Unreleased category. Write a new entry only when the
implementation did not add one.

## 3. Stage selectively

Stage named paths only:

```sh
git add path/to/file path/to/another-file
```

Never use `git add .` or `git add -A`. Unstage any held-back file a hook or helper touched.

## 4. Audit docs

When staged changes add or change a config key, command, domain term, or what an updater does (files, pointer, reload,
precondition), check `README.md`, `GLOSSARY.md`, `core/README.md`, `livery/DESIGN.md`, `livery/ADAPTERS.md`, and the adapter's `README.md` against the diff. Fix and stage the
confirmed docs in this same commit.

## 5. Verify

Run:

```sh
npm run verify
```

`npm run verify` is the CI-parity pass. The pre-commit hook checks formatting and lint on staged files; pre-push runs
`npm run verify`, and `npm run test:e2e` when the push touches `livery/`, `core/src/`, or adapter themes. If verification fails, fix the cause, restage, and run it again.

A docs-only change may skip `npm run verify`, but say that it was skipped.

`npm run verify` leaves out the end-to-end suite. When the staged change touches the livery UI, an updater's files or
pointer, or anything under `livery/e2e/`, also run `npm run test:e2e`. A failing spec or screenshot means the suite needs the
same update as the code: fix its specs, fixtures, or baselines in this commit, and look at a changed screenshot before
accepting it with `--update-snapshots`.

## 6. Draft and ask

The message is a [Conventional Commit](https://www.conventionalcommits.org/); release-please derives the next version from it:

```text
<type>(<scope>): <imperative summary>
```

End the subject with `#22`, the open migration epic. Once it closes, end it with the commit's own issue:
`<type>(<scope>): <summary> #<issue>`.

- `feat` for new user-facing behavior, `fix` for a user-facing bug fix. Both trigger a release.
- `docs`, `refactor`, `perf`, `test`, `ci`, `chore` for the rest. Only `docs`, `refactor`, and `perf` count toward a release.
- `docs` is for user-facing documentation. Agent skills, `AGENTS.md`, and maintainer-only docs are `chore`, so they
  never open a release on their own.
- The scope is the package directory, as in recent history: `core`, `livery`, `nvim`, `ghostty`, `herdr`, `tuicr`.
  Omit it for root-level changes and changes that span packages.
- A breaking change adds `!` after the scope and a `BREAKING CHANGE:` footer.

Keep the subject under 70 characters, not counting a suffix, and describe the outcome, not the file list. Add a short
bullet body only when the change has several moving parts. Do not narrate history with phrases such as "instead of" or "no longer".

Show:

1. the final in-scope paths;
2. held-back and stray paths;
3. the exact commit message;
4. the verification result.

Then ask: **Go-ahead to commit?**

## 7. Commit after approval

Use a heredoc so the message stays intact:

```sh
git commit -m "$(cat <<'MSG'
<message>
MSG
)"
```

The hook runs its staged checks. If a hook fails, fix the cause, restage, and make a new commit attempt. Do not amend an
unrelated commit. Confirm the new log entry and final status.
