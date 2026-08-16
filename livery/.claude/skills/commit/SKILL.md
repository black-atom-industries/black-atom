---
name: commit
description: Create a git commit with livery conventions — conventional commits with fe/be scope prefix
argument-hint: [optional commit message override]
---

# Commit

Create a commit following livery conventions.

## Format

```
<type>(<scope>): <description> [#<github-issue>]
```

### Types

`feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `ci`

### Scope

Determined by which files changed:

| Changed files                | Scope      | Example                                              |
| ---------------------------- | ---------- | ---------------------------------------------------- |
| Only `src/`                  | `fe`       | `feat(fe): add theme preview component #300`         |
| Only `src-tauri/`            | `be`       | `fix(be): handle tilde expansion in yaml paths #317` |
| Both `src/` and `src-tauri/` | omit scope | `feat: add lazygit updater #317`                     |
| Neither (docs, config, CI)   | omit scope | `docs: update AGENTS.md #324`                        |

### GitHub Issue

Include the GitHub issue number (e.g., `#317`) if one is available in context — branch name,
conversation, or recent issue lookup.

## Rules

- **Every commit must be green** — tests pass, lint clean.
- Each commit should represent a distinct, working change.
- Keep history clean — use amend or fixup instead of stacking fix-on-fix commits.
- **Always ask before amending or fixup.** These rewrite history and can go wrong. Confirm with the
  user which commit to target before running.

## Strategies

Choose the right strategy based on what you're fixing:

| Situation                                 | Strategy           | Command                        |
| ----------------------------------------- | ------------------ | ------------------------------ |
| Fix belongs to the **previous** commit    | Amend              | `git commit --amend --no-edit` |
| Fix belongs to an **older** commit        | Fixup + autosquash | See below                      |
| Change is a **new distinct unit** of work | New commit         | Normal commit                  |

### Fixup workflow

When a fix belongs to a commit that's not the most recent:

```bash
# 1. Find the target commit
git log --oneline -10

# 2. Create a fixup commit pointing to the target
git commit --fixup=<sha>

# 3. Autosquash to merge the fixup into the target commit
git rebase -i --autosquash <sha>~1
```

This keeps the branch history clean — each commit is a coherent, working change.

## Process

1. Check `git status` and `git diff --staged` to understand what's being committed
2. Determine scope from changed file paths
3. Decide strategy: amend, fixup, or new commit
4. Draft a concise message (1 sentence) focusing on the _why_, not the _what_
5. Include GitHub issue if available
6. Stage specific files (avoid `git add -A`)
7. Commit via heredoc for proper formatting
