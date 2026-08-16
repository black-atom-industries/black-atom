# Phase 5 — CI, release-please, docs, follow-ups

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** release-please is configured for the monorepo with today's versions and cuts nothing; the root README, the Neovim manual install and every package README describe the monorepo; the follow-up issues exist; CI is green on `main`.

**Architecture:** release-please in manifest mode with two packages, `livery` (0.2.0) and `core` (0.4.0), component tags (`livery-v0.2.0`, `core-v0.4.0`), a `release.yml` workflow that only runs release-please and syncs `Cargo.lock` on its PR branch. No build or publish jobs. Docs are rewritten in Nik's voice for the tree as it is.

**Tech Stack:** release-please-action v4, GitHub Actions.

## Global Constraints

- Source repos under `/Users/brunner/repos/black-atom-industries/<name>/` are read-only.
- Nothing is released: no tag, no artifacts, no version bump. If release-please opens a release PR, it stays open. Versions: core 0.4.0, livery 0.2.0 (`livery/deno.json`, `livery/src-tauri/Cargo.toml`, `livery/core/Cargo.toml`, `livery/cli/Cargo.toml`, `livery/src-tauri/tauri.conf.json` — the last one currently says 0.1.0 and is set to 0.2.0 here so release-please can track it).
- Commit format `<type>(<scope>): <description> black-atom-industries/livery#68`. Subagents never commit.
- Docs: present tense, what is; no history, no "was", "replaces", "formerly", "monorepo migration" narrative; no em-dashes; Nik's voice (`my-voice`). Every backticked path exists.
- Every commit green (pre-commit hook).

---

### Task 1: release-please

**Files:**

- Create: `.github/release-please-config.json`, `.github/.release-please-manifest.json`, `.github/workflows/release.yml`
- Modify: `livery/src-tauri/tauri.conf.json` (`version` → `0.2.0`), `.claude/skills/release/SKILL.md` (paths are now real: `.github/release-please-config.json`, tag `livery-v<version>`, no artifacts job yet), root `README.md` gets a short "Releases" line in Task 2.

- [ ] Config (`.github/release-please-config.json`):

```json
{
    "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
    "include-component-in-tag": true,
    "packages": {
        "livery": {
            "component": "livery",
            "release-type": "simple",
            "bump-minor-pre-major": true,
            "bump-patch-for-minor-pre-major": false,
            "changelog-sections": [
                { "type": "feat", "section": "Features" },
                { "type": "refactor", "section": "Refactors" },
                { "type": "fix", "section": "Bug Fixes" },
                { "type": "docs", "section": "Documentation" },
                { "type": "perf", "section": "Performance" },
                { "type": "ci", "section": "CI" }
            ],
            "extra-files": [
                { "type": "json", "path": "deno.json", "jsonpath": "$.version" },
                { "type": "toml", "path": "src-tauri/Cargo.toml", "jsonpath": "$.package.version" },
                { "type": "toml", "path": "core/Cargo.toml", "jsonpath": "$.package.version" },
                { "type": "toml", "path": "cli/Cargo.toml", "jsonpath": "$.package.version" },
                { "type": "json", "path": "src-tauri/tauri.conf.json", "jsonpath": "$.version" }
            ]
        },
        "core": {
            "component": "core",
            "release-type": "simple",
            "bump-minor-pre-major": true,
            "bump-patch-for-minor-pre-major": false,
            "changelog-sections": [
                { "type": "feat", "section": "Features" },
                { "type": "refactor", "section": "Refactors" },
                { "type": "fix", "section": "Bug Fixes" },
                { "type": "docs", "section": "Documentation" },
                { "type": "perf", "section": "Performance" }
            ],
            "extra-files": [{ "type": "json", "path": "deno.json", "jsonpath": "$.version" }]
        }
    }
}
```

Paths in `extra-files` are relative to the package path. Manifest: `{ "livery": "0.2.0", "core": "0.4.0" }`. Verify the `livery/cli/Cargo.toml` and `livery/core/Cargo.toml` `version` fields are `0.2.0`; set them if not.

- [ ] Workflow (`.github/workflows/release.yml`): name `release`, on push to `main`, `permissions: contents: write, pull-requests: write`, job `release-please` with `googleapis/release-please-action@v4` (`config-file`, `manifest-file`), then when `steps.release.outputs.prs_created == 'true'` (v4 output name; check the action README) check out the PR head branch (`fromJSON(steps.release.outputs.pr).headBranchName`), run `cargo update --workspace` at the repo root, commit `Cargo.lock` as `github-actions[bot]` with message `chore: sync Cargo.lock with version bump`, push. Root `Cargo.lock` path. `deno fmt --check .github/` clean.
- [ ] Repo setting: `REPO=black-atom-industries/black-atom; gh api --method PUT "/repos/${REPO}/actions/permissions/workflow" -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true` (orchestrator runs it; Nik authorized `gh` for this repo).
- [ ] Verify: `deno fmt --check`, JSON valid (`deno eval` or `python3 -m json.tool`), the five extra-file paths exist relative to `livery/`; `deno task check`.
- [ ] Commit (orchestrator): `ci: release-please for livery and core, versions unchanged black-atom-industries/livery#68`

### Task 2: Root README, Neovim manual install, package READMEs

Load `my-voice`. Three parallel subagents (sonnet), disjoint files:

**2a. Root `README.md`** (rewrite): what Black Atom is (themes for developer tools; collections `default`, `jpn`, `terra`, `stations`, `mnml`, `paper`; dark and light); the layout (`core/`, `adapters/<name>/`, `livery/` with GUI `livery-gui` and CLI `livery`, `website/`, `ui/`); getting started for a contributor (`git clone`, `deno install`, `deno task dev`, `deno task generate`, `deno task check`, `deno task test`); using the themes without livery: one paragraph per adapter class with a pointer to the adapter README (`adapters/ghostty/README.md` etc.), the Neovim manual install inline (put `adapters/nvim` on the runtimepath: `vim.opt.rtp:prepend("<path>/adapters/nvim")` or a plugin manager entry pointing at the directory, set `vim.g.black_atom_core_config = { ... }` before `:colorscheme black-atom-jpn-koyo-yoru`; option table with defaults from `adapters/nvim/lua/black-atom/config.lua`); livery in three lines (`cd livery && deno task build`, `livery setup`, `livery apply <theme>`, GUI `livery-gui`); a "Releases" line (release-please, conventional commits, tags `livery-v*` / `core-v*`); license. Under ~120 lines.

**2b. Adapter READMEs** (`adapters/{ghostty,herdr,lazygit,niri,obsidian,tmux,waybar,wezterm,zed,nvim}/README.md`): remove multi-repo talk (cloning sibling repos, `git clone https://github.com/black-atom-industries/<name>`, "core repository is the single source of truth", JSR, `deno task update`, GitHub links to core/livery/other adapters that now live in this tree → relative links `../../core/`, `../../livery/`); the "install the theme files" section points at the generated files in this tree (`themes/<collection>/black-atom-*.<ext>`, nvim `colors/`) or at livery (`livery apply`); the "development" section says `deno task generate` in the adapter dir, `deno task dev` to watch, templates path; keep app-specific instructions (how the app loads a theme) intact. Cut, don't pad. nvim's README was updated in Phase 3; check it against the same rules and align its "Installation" section with the root README wording. Also `adapters/nvim/CONTRIBUTION.md` if it names the old layout.

**2c. `livery/README.md`**: describe the app as it is: GUI + CLI, themes embedded and unpacked to `$XDG_DATA_HOME/black-atom/themes`, config at `$XDG_CONFIG_HOME/black-atom/livery/config.json`, provisioning classes (link to `livery/ADAPTERS.md`), CLI usage (`livery`, `livery apply <theme>`, `livery list`, `livery status`, `livery setup`, `livery appearance <dark|light>`, `livery nvim-settings`), development (`deno task dev:livery`, `cargo test`, `cd livery && deno task build`), no download/greeting/manifest vocabulary, no multi-repo links. Also `livery/HOW_TO_TEST.md` if it exists: leave it (the root `HOW_TO_TEST.md` in Close covers acceptance) or delete if it only describes the download flow — say which.

- [ ] Verify (each agent): `deno fmt --check` on touched files; backticked paths exist; `grep -n "black-atom-industries/\(core\|nvim\|ghostty\|herdr\|lazygit\|niri\|obsidian\|tmux\|waybar\|wezterm\|zed\|livery\)\b" <files>` shows only the `#68` epic reference or nothing; `grep -in "jsr:@black-atom\|deno task update\|sibling\|monorepo migration" <files>` empty.
- [ ] Commit (orchestrator, one commit): `docs: READMEs for the tree as it is black-atom-industries/livery#68`

### Task 3: Follow-up issues (orchestrator, `my-voice`, short bodies, each links the epic)

In `black-atom-industries/black-atom`:

1. **Consume core from the monorepo in helm.tmux** — helm.tmux (Go app, `internal/ui/theme/collection.template.go`, generation into Go source, Go toolchain in CI) still consumes `@black-atom/core` from JSR; decide how it reads core once JSR publishing stops (git dependency on this repo, or a generated Go file committed here and vendored there).
2. **Archive and clean up the thirteen source repos** — core, livery, ten adapters, adapter-template: archive on GitHub with a README pointing here, unpublish/deprecate `@black-atom/core` on JSR, remove core's `publish` task and `exports`, move livery's open issues #35, #36, #37, #38, #44, #46, #47, #65, #67 across. Only after Nik has tested this repo.
3. **Distribution: Homebrew cask and Linux install** — one artifact with `livery-gui` and `livery`, release workflow builds macOS `.dmg` and a Linux artifact on tag; cask formula.
4. **Updaters for niri, waybar, wezterm** — adapters exist and are embedded/unpacked; livery has no `AppName`/updater for them.
5. **First release version** — decide the version to cut (1.0 or continue at 0.x), merge the release-please PR, verify tags `livery-v*`/`core-v*`.
6. **Post-migration polish** — the ledger's minors: CLI panics on closed stdout pipe (SIGPIPE), eight adapter pages hardcode their provisioning class instead of reading `get_app_status`, `AppStatus.linked` has no UI consumer, `Capability::ALL` is hand-maintained, herdr lost its stale-file cleanup on theme rename (regenerate covers it), nvim README collection table lacks `paper`, `core/UBIQUITOUS_LANGUAGE.md` lacks `paper`, `dev_bridge.rs` `get_app_status` arm untested, settings persist even when the Lua write fails.

Record numbers in `MIGRATION.md` "Follow-up issues filed".

### Task 4: Phase gate (orchestrator)

- [ ] Push; CI (`ci` and `release` workflows) green on `main`; if release-please opens a PR, leave it and note the number.
- [ ] Reviewer (sonnet) over docs + config; Codex second review; fix Important+.
- [ ] `MIGRATION.md`: Phase Close, Next: HOW_TO_TEST.md.
