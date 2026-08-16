# Phase 1 — Stand up the repo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One repo `black-atom/` holding core, ten adapters, livery, `website/` and `ui/` placeholders, with Deno + Cargo workspaces, unified tooling, root agent context, six skills, one CI workflow, and the existing test suites green from the root.

**Architecture:** Copy the working trees of the twelve source repos into place (no history). One root `deno.json` (workspace + fmt/lint) and one root `Cargo.toml` (workspace). Per-package configs keep only what is package-local. Root `.claude/`, `CLAUDE.md`, `.githooks/`, `.github/workflows/ci.yml` are written fresh; the old ones are reference material only.

**Tech Stack:** Deno 2.9, Cargo 1.97, Tauri v2, Vite 6, React 18 (livery) / React 19 (core/monitor), release-please later.

## Global Constraints

- Source repos under `/Users/brunner/repos/black-atom-industries/<name>/` are read-only. No edits, no git commands that mutate, no generated output landing there.
- Never run `livery`, `tauri dev`, updaters, or anything writing config against the real `$HOME`. Sandbox: `export HOME="$(mktemp -d)"; export XDG_CONFIG_HOME="$HOME/.config"; export XDG_DATA_HOME="$HOME/.local/share"`.
- Commit format: `<type>(<scope>): <description> black-atom-industries/livery#68`, types `feat|fix|refactor|chore|docs|perf|ci`, scope = package or omitted for root/multi-package. Subagents never commit.
- No comments that are conversation residue; docs state what is (no "was removed", "replaces").
- Simplest thing that works. Surgical changes.
- Version numbers stay: core 0.4.0, livery 0.2.0.
- Formatting: indentWidth 4, lineWidth 100, semiColons, double quotes (the config core, livery and monitor already share).

## Landmines (read before touching core)

- `core/src/config.ts` `config.dir.org` and `core/src/lib/discover-adapters.ts` `getAdapters()` resolve the org dir as `dirname(dirname(cwd))/black-atom-industries`. From `black-atom/core` that is the OLD org checkout. `core/src/tasks/adapters/generate.ts` runs `git add -A` / `git reset` / `git commit` inside each adapter dir. Task 4 re-points this at `black-atom/adapters/` and strips the git calls before any `dev:*` task exists.
- Deno workspace: `node_modules` materialises at the repo root only (verified). `livery/src-tauri/tauri.conf.json` `$schema` and `livery/vite.config.ts`'s culori alias reference `node_modules` relatively.
- Cargo workspace: `target/` moves to the repo root. `livery/deno.json` `install:macos` and `test:perf-benchmark` reference `src-tauri/target`.
- Actual counts today: `cargo test` 100 passed (brief says 101), `deno test -P` 70 passed.

---

### Task 1: Copy the trees, root `.gitignore`, `MIGRATION.md`, first commit

**Files:**

- Create: `black-atom/core/`, `black-atom/livery/`, `black-atom/adapters/{ghostty,herdr,lazygit,niri,nvim,obsidian,tmux,waybar,wezterm,zed}/`
- Create: `black-atom/website/README.md`, `black-atom/ui/README.md`
- Create: `black-atom/.gitignore`, `black-atom/MIGRATION.md`, `black-atom/README.md`

- [ ] **Step 1: rsync each source into place**

From `/Users/brunner/repos/black-atom-industries/`:

```sh
EXCL=(--exclude .git --exclude node_modules --exclude target --exclude dist --exclude .vite --exclude .DS_Store --exclude handoffs --exclude deno.lock --exclude .claude/settings.local.json --exclude .github/workflows)
rsync -a "${EXCL[@]}" core/ black-atom/core/
rsync -a "${EXCL[@]}" livery/ black-atom/livery/
for a in ghostty herdr lazygit niri nvim obsidian tmux waybar wezterm zed; do
  rsync -a "${EXCL[@]}" "$a/" "black-atom/adapters/$a/"
done
```

Do not use `git subtree`, do not copy `adapter-template/`, `helm.tmux/`, `helm.herdr/`, `website/`, `ui/`, `ai/`, `claude/`, `atlas/`, `shiplog/`, `iter.nvim/`, `radar.nvim/`.

- [ ] **Step 2: Remove copied cruft that the old `.gitignore`s hid**

Check each copied dir against its old ignore file: `nvim` (`debug/`, `check.json`, `*.log`, `Session.vim`, `/plans`), `core` (`black-atom-core` binary, `tmp/`, `HANDOFF-*.md`, `.superpowers/`, `docs/superpowers/`, `.claude/tasks/`, `/.visual-companion`), `livery` (`livery` binary, `.worktrees/`, `docs/plans/`, `/plans`, `/.impeccable`), `obsidian` (`tmp_*`, `.env`), any `.github/` dir left empty after excluding `workflows/` (keep non-workflow files such as issue templates only if they exist; delete empty dirs). Command to list candidates: `cd black-atom && git -C ../core status --ignored --porcelain | grep '^!!'` for each source, and delete the matching paths under `black-atom/`.

- [ ] **Step 3: Placeholder dirs**

`black-atom/website/README.md`:

```md
# website

Placeholder for the Black Atom website. Rebuilt from scratch later; not wired into the workspace.
```

`black-atom/ui/README.md`:

```md
# ui

Placeholder for a shared UI package. Not in use yet; not wired into the workspace.
```

- [ ] **Step 4: Root `.gitignore`**

```gitignore
node_modules/
target/
dist/
.vite/
.DS_Store
handoffs/
tmp/
*.log
.env
.claude/settings.local.json
livery/src-tauri/gen/schemas/
```

Keep `livery/.gitignore` for now only if it has patterns not covered above; otherwise delete per-package `.gitignore` files (core, livery, nvim, obsidian, waybar, zed) and fold their real patterns into the root file. Root ignores `deno.lock`? No: the single root `deno.lock` is committed.

- [ ] **Step 5: `MIGRATION.md`**

```md
# Migration state

Phase: 1
Last completed task: 1.1 trees copied
Next: 1.2 deno workspace
Blocked on Nik: (none)
Decisions made in-run:

- 2026-08-16 core's org-dir resolution and per-adapter git calls are re-pointed/removed in Phase 1 (task 1.4) so no dev task can write into the old checkouts.
- 2026-08-16 baseline counts are 100 Rust tests (brief says 101) and 70 TS tests.
  Follow-up issues filed: (none)
```

- [ ] **Step 6: Root `README.md`** (short; Phase 5 rewrites it)

```md
# Black Atom

One repo for the Black Atom design system: `core/` defines the themes, `adapters/` render them, `livery/` installs them.
```

- [ ] **Step 7: Verify tree**

`ls black-atom` → `Cargo.toml`? (not yet) `core adapters livery website ui docs MIGRATION.md README.md .gitignore`. `ls black-atom/adapters` → the ten names. `find black-atom -name .git -maxdepth 4` → only `black-atom/.git`. `find black-atom -name node_modules -o -name deno.lock -o -name target | grep -v '^black-atom/.git'` → empty.

- [ ] **Step 8: Commit** (orchestrator): `chore: copy core, ten adapters and livery into one tree black-atom-industries/livery#68`

---

### Task 2: Deno workspace

**Files:**

- Create: `black-atom/deno.json`, `black-atom/deno.lock`
- Modify: `black-atom/core/deno.json`, `black-atom/core/monitor/deno.json`, `black-atom/livery/deno.json`, every `black-atom/adapters/*/deno.json`

- [ ] **Step 1: Root `deno.json`**

```json
{
    "$schema": "https://raw.githubusercontent.com/denoland/deno/main/cli/schemas/config-file.v1.json",
    "workspace": [
        "./core",
        "./core/monitor",
        "./livery",
        "./adapters/ghostty",
        "./adapters/herdr",
        "./adapters/lazygit",
        "./adapters/niri",
        "./adapters/nvim",
        "./adapters/obsidian",
        "./adapters/tmux",
        "./adapters/waybar",
        "./adapters/wezterm",
        "./adapters/zed"
    ],
    "nodeModulesDir": "auto",
    "tasks": {},
    "lint": {
        "rules": { "exclude": ["no-slow-types"] },
        "exclude": [
            "core/monitor/src/routeTree.gen.ts",
            "livery/src/routeTree.gen.ts",
            "livery/src/bindings.ts",
            "livery/docs/design-system/reference/",
            "adapters/*/themes/",
            "adapters/nvim/lua/black-atom/themes/",
            "adapters/nvim/colors/"
        ]
    },
    "fmt": {
        "useTabs": false,
        "lineWidth": 100,
        "indentWidth": 4,
        "semiColons": true,
        "singleQuote": false,
        "proseWrap": "preserve",
        "exclude": [
            "**/CHANGELOG.md",
            "core/monitor/src/routeTree.gen.ts",
            "livery/src/routeTree.gen.ts",
            "livery/src/bindings.ts",
            "livery/src-tauri/",
            "livery/docs/design-system/reference/",
            "adapters/*/themes/",
            "adapters/nvim/lua/black-atom/themes/",
            "adapters/nvim/colors/",
            "adapters/obsidian/theme.css"
        ]
    }
}
```

`tasks` is filled by Task 5. Adjust the exclude lists to what `deno fmt --check` and `deno lint` actually flag as generated/vendored; never format generated theme output.

- [ ] **Step 2: Prune member configs to package-local content**

- `core/deno.json`: keep `name`, `version`, `exports`, `publish`, `tasks`, `imports`, `exclude: ["monitor/"]`; drop `lint`, `fmt`, `$schema`, and the `lock` task. Leave the cross-repo tasks in place (Phase 2 removes them).
- `core/monitor/deno.json`: drop `nodeModulesDir`, `lint`, `fmt`; keep `unstable`, `tasks`, `compilerOptions`, `imports`.
- `livery/deno.json`: remove `links`, remove the `"@black-atom/core"` import entry (workspace resolves the package name), drop `nodeModulesDir`, `lint`, `fmt`, `$schema`; keep `version`, `compilerOptions`, `tasks`, `test`, `imports`. Fix `test:perf-benchmark` and `install:macos` paths in Task 3.
- adapters' `deno.json`: unchanged (tasks only; Phase 2 rewrites the `generate` invocation). Obsidian keeps its `imports` and tasks; drop its `fmt`/`lint`. Herdr keeps `imports`, drop `lock: false`.

- [ ] **Step 3: Regenerate lockfile and node_modules**

`cd black-atom && deno install` → creates `deno.lock` and root `node_modules/`. Expected: no error; `ls node_modules/@tauri-apps` exists; `ls livery/node_modules` does not exist.

- [ ] **Step 4: Verify checks from root**

```sh
cd black-atom
grep -rn "jsr:@black-atom/core" --include=deno.json . | grep -v node_modules
deno check
deno lint
deno fmt --check
deno test -P
```

Expected: the grep lists only the ten adapters' `generate`/`dev`/`update` tasks; `deno check` passes for livery, core, monitor; `deno lint` clean; `deno fmt --check` clean (run `deno fmt` once and inspect the diff: only real source files may change, generated output must be excluded); `deno test -P` ends with `70 passed` for livery plus core's and monitor's own tests, 0 failed. Record the exact total in the task report.

If `deno test -P` from root fails on core because core's tests need `--allow-all` beyond `-P` config, add a `test.permissions` block to `core/deno.json` matching what its tests need (read/write/env/run as required) rather than loosening the root.

- [ ] **Step 5: Commit** (orchestrator): `chore: deno workspace over core, monitor, livery and the adapters black-atom-industries/livery#68`

---

### Task 3: Cargo workspace and livery path re-rooting

**Files:**

- Create: `black-atom/Cargo.toml`
- Modify: `black-atom/livery/src-tauri/tauri.conf.json`, `black-atom/livery/deno.json`, `black-atom/livery/vite.config.ts` (only if the culori alias breaks)

- [ ] **Step 1: Root `Cargo.toml`**

```toml
[workspace]
resolver = "2"
members = ["livery/src-tauri"]
```

Copy livery's `Cargo.lock` from `livery/src-tauri/Cargo.lock` to the root `Cargo.lock` if it exists there, delete the nested one.

- [ ] **Step 2: Re-root paths**

- `livery/src-tauri/tauri.conf.json`: `$schema` → `../../node_modules/@tauri-apps/cli/config.schema.json`.
- `livery/deno.json` tasks: `install:macos` bundle path → `../target/release/bundle/macos/livery.app`; `test:perf-benchmark` unchanged (cargo finds the workspace target).
- `livery/vite.config.ts`: run `cd livery && deno task vite:build`; if the culori alias fails to resolve, point it at the root `node_modules` (`../node_modules/culori/...`) or drop the alias if it is no longer needed now that core is in-tree. Minimal change; record which.

- [ ] **Step 3: Verify**

```sh
cd black-atom && cargo test 2>&1 | grep "test result"
cd black-atom/livery && deno task vite:build && ls dist/index.html
```

Expected: `100 passed; 0 failed` (plus empty suites); vite build produces `livery/dist/index.html`. Do NOT run `deno task dev` (tauri dev) against the real HOME. Instead prove tauri dev startup with a sandbox HOME and a timeout: `HOME=$(mktemp -d) XDG_CONFIG_HOME=$HOME/.config XDG_DATA_HOME=$HOME/.local/share timeout 90 deno task dev` from `livery/`; expected: Vite serves on 1420 and cargo begins compiling the tauri crate without a config/path error, then the timeout kills it. Full window verification is Nik's.

- [ ] **Step 4: Commit** (orchestrator): `chore(livery): cargo workspace root, re-root node_modules and target paths black-atom-industries/livery#68`

---

### Task 4: Core generation reads and writes only inside this repo

**Files:**

- Modify: `black-atom/core/src/config.ts`, `black-atom/core/src/lib/discover-adapters.ts`, `black-atom/core/src/tasks/adapters/generate.ts`, `black-atom/core/src/tasks/adapters/watch.ts` (only if it references the org dir)

- [ ] **Step 1: Point the org dir at `adapters/`**

`core/src/config.ts`: `org: join(dirname(Deno.cwd()), "adapters")` and drop `orgName` if nothing else reads it (grep `orgName`; `org.ts` uses it, and `org.ts` is deleted in Phase 2, so leave `orgName` if `org.ts` still compiles against it, otherwise remove both together — prefer removing `core/src/tasks/org.ts` + `org_test.ts` + the `org` task now, since it only orchestrates the old repos).

`core/src/lib/discover-adapters.ts` `getAdapters()`: `const orgDir = join(dirname(Deno.cwd()), "adapters"); return await discoverAdapters(orgDir);` and drop the `ORG_NAME` constant. Remove the `if (entry.name === "core") continue;` skip only if it becomes dead; harmless either way.

- [ ] **Step 2: Strip git from generation**

`core/src/tasks/adapters/generate.ts` `generateAllRepositories`: remove the `git status --porcelain`, `git add -A`, `git diff --staged --stat`, `git commit`, `git reset` calls and the `commit`/`gitCommitArgs` options; the callback runs core's CLI in the adapter dir, runs `postGenerate`, and records `{ adapter, error? }`. Update `generateSingleAdapter` the same way. Update callers (`watch.ts`, `core/src/tasks/index.ts` `adapters:gen`, `theme:commit`) to the new signature; if `theme:commit`/`adapters:commit|push|reset|status` cannot compile without the git helpers, delete those task entries and their files now (they exist only to coordinate the old repos; Phase 2 would delete them anyway). Keep `adapters:gen`, `dev`, `adapters:each` working.

Also `runCommand(["deno","run","-A","--config",` ${coreDir}/deno.json`, `${coreDir}/src/cli/index.ts`, "generate"], { cwd: adapterDir })`: verify this works inside the workspace (Deno may reject `--config` pointing at a member). If it fails, invoke as `deno run -A ${coreDir}/src/cli/index.ts generate` with cwd = adapter dir and let the workspace resolve imports. Record what worked in the report; the same invocation is what Phase 2 puts into every adapter's `generate` task.

- [ ] **Step 3: Verify**

```sh
cd black-atom && deno check core/ && deno test -P core/ && deno lint core/
cd black-atom/core && deno task adapters:gen
cd black-atom && git status --porcelain | head
for r in core ghostty herdr lazygit niri nvim obsidian tmux waybar wezterm zed livery; do echo -n "$r: "; git -C /Users/brunner/repos/black-atom-industries/$r status --porcelain | wc -l; done
```

Expected: checks pass; `adapters:gen` regenerates the ten adapters in `black-atom/adapters/*` (git status may show diffs in generated files if the old repos were behind core — that is fine and expected, note which); every old repo prints `0`. Regenerated files that only differ by content produced by current core stay (they are correct now).

- [ ] **Step 4: Commit** (orchestrator): `refactor(core): generate into adapters/ in-tree, no git side effects black-atom-industries/livery#68`

---

### Task 5: Root dev tasks

**Files:**

- Modify: `black-atom/deno.json` (`tasks`)
- Create: `black-atom/scripts/dev.ts`
- Modify: `black-atom/core/deno.json` (split `dev` into watcher-only; monitor tasks)

- [ ] **Step 1: Core tasks**

In `core/deno.json` tasks: `"dev": "deno run -A src/tasks/dev.ts"` stays as-is only if `dev.ts` is changed to run the watcher only. Do that: `core/src/tasks/dev.ts` becomes `import { watch } from "./adapters/watch.ts"; await watch();` (drop monitor server + vite from it). Add `"monitor": "deno run -A src/tasks/monitor.ts"` where `core/src/tasks/monitor.ts` holds the previous `startPreviewServer()` + Vite spawn (the code removed from `dev.ts`, verbatim). Remove `monitor:api`/`monitor:app` if `monitor.ts` covers both; keep them if the monitor README documents them separately (check `core/monitor/CLAUDE.md`/README).

- [ ] **Step 2: Root tasks**

```json
"tasks": {
    "dev": "deno run -A scripts/dev.ts",
    "dev:adapters": "cd core && deno task dev",
    "dev:monitor": "cd core && deno task monitor",
    "dev:livery": "cd livery && deno task dev",
    "generate": "cd core && deno task adapters:gen",
    "check": "deno check && deno lint && deno fmt --check",
    "test": "deno test -P && cargo test"
}
```

`scripts/dev.ts` spawns the three `deno task dev:*` commands with `Deno.Command` (cwd = repo root, stdout/stderr inherit), forwards SIGINT/SIGTERM to kill all three, exits when any exits. Under 40 lines, no `any`.

- [ ] **Step 3: Verify**

```sh
cd black-atom
timeout 20 deno task dev:adapters; echo $?          # watcher starts, prints watching lines, killed by timeout (124)
timeout 30 deno task dev:monitor; echo $?           # API server + vite start (124)
HOME=$(mktemp -d) XDG_CONFIG_HOME=$HOME/.config XDG_DATA_HOME=$HOME/.local/share timeout 60 deno task dev:livery; echo $?   # vite + cargo start (124)
HOME=$(mktemp -d) XDG_CONFIG_HOME=$HOME/.config XDG_DATA_HOME=$HOME/.local/share timeout 60 deno task dev; echo $?           # all three start (124)
```

Each prints its startup lines and no error before the timeout. Ports: livery vite 1420, monitor vite whatever `core/monitor` uses, monitor API whatever `monitor-server.ts` uses; if two collide, note it.

- [ ] **Step 4: Commit** (orchestrator): `feat: root dev, dev:adapters, dev:monitor, dev:livery tasks black-atom-industries/livery#68`

---

### Task 6: Tooling — `.githooks/`, `.claude/settings.json`, hooks re-rooted

**Files:**

- Create: `black-atom/.githooks/pre-commit`
- Create: `black-atom/.claude/settings.json`, `black-atom/.claude/hooks/no-fs-plugin.sh`, `black-atom/.claude/hooks/check-bindings.sh`
- Delete: `black-atom/livery/.claude/settings.json`, `black-atom/livery/.claude/hooks/`, `black-atom/livery/.githooks/`, `black-atom/core/.claude/settings.json`, `black-atom/core/scripts/hooks/`, `black-atom/adapters/*/.claude/settings.json`, `core/.agents` symlink targets if they only pointed at skills (check `core/.claude/skills` symlink → `../.agents/skills`; skills are rewritten in Task 8, so delete both), `livery/.githooks/checks-*.ts` after folding their content into the root hook, `livery/deno.json` `checks` and `install-hooks` tasks, `core/deno.json` `install-hooks` task.

Load `dev-setup-pre-commit` first and follow it (native `core.hooksPath`, Deno flavour).

- [ ] **Step 1: `.githooks/pre-commit`**

Runs, from the repo root: `deno fmt --check`, `deno lint`, `deno check`, `deno test -P`, and `cargo fmt --check` + `cargo clippy -- -D warnings` + `cargo test` only when a staged path starts with `livery/src-tauri/` (or any `.rs`/`Cargo.toml`). Read `livery/.githooks/checks-frontend.ts` and `checks-backend.ts` for what livery ran (bindings freshness, etc.) and keep any check that is not already covered. Root task `"install-hooks": "git config core.hooksPath .githooks"`. Run it once in `black-atom`.

- [ ] **Step 2: `.claude/settings.json`**

Re-root livery's PostToolUse hooks:

```json
{
    "permissions": {
        "allow": [
            "Bash(deno:*)",
            "Bash(cargo:*)",
            "Bash(gh pr:*)",
            "Bash(gh issue:*)",
            "Bash(gh api:*)",
            "Bash(git pull:*)",
            "Bash(git checkout:*)",
            "Bash(ls:*)",
            "Bash(head:*)",
            "Bash(cd:*)"
        ]
    },
    "hooks": {
        "PostToolUse": [
            {
                "matcher": "Write|Edit|MultiEdit",
                "hooks": [
                    {
                        "type": "command",
                        "command": "deno fmt \"$FILEPATH\" 2>/dev/null; case \"$FILEPATH\" in *livery/src-tauri/*) (cd livery/src-tauri && cargo fmt 2>/dev/null);; esac; true"
                    },
                    { "type": "command", "command": ".claude/hooks/no-fs-plugin.sh" },
                    { "type": "command", "command": ".claude/hooks/check-bindings.sh" }
                ]
            }
        ]
    }
}
```

`no-fs-plugin.sh` greps `livery/src/**/*.ts(x)`; `check-bindings.sh` checks `livery/src/bindings.ts`. Copy the old scripts' logic, change only the paths, keep them executable.

- [ ] **Step 3: Verify**

`git config core.hooksPath` → `.githooks`; `bash .claude/hooks/no-fs-plugin.sh; echo $?` → 0; `bash .claude/hooks/check-bindings.sh; echo $?` → 0; `bash .githooks/pre-commit` from the root exits 0 (it runs the full check set; allow several minutes). `find black-atom -name settings.json -path '*/.claude/*'` → only the root one. `find black-atom -name .githooks -o -name hooks -path '*scripts*'` → only root.

- [ ] **Step 4: Commit** (orchestrator): `chore: one .githooks and one .claude/settings.json for the tree black-atom-industries/livery#68`

---

### Task 7: Root `CLAUDE.md` and scoped `AGENTS.md`

**Files:**

- Create: `black-atom/CLAUDE.md`, `black-atom/livery/src/AGENTS.md`, `black-atom/livery/src-tauri/AGENTS.md`
- Delete: every other `CLAUDE.md`, `AGENTS.md`, `CLAUDE.local.md` under `black-atom/` (core, core/monitor, livery, adapters/*, and symlinks), `livery/.claude/skills/about-pick-theme-original/`, `livery/.claude/skills/commit/`; move `livery/.claude/skills/backend-testing/` to `black-atom/.claude/skills/backend-testing/` with its paths re-rooted to `livery/src-tauri/...`.

Load `dev-setup-llm` and `my-voice` first. Reference material (read, do not copy prose wholesale): the deleted `CLAUDE.md`/`AGENTS.md` files, `/Users/brunner/repos/black-atom-industries/ai/src/org-context.md`, livery's `commit` skill.

- [ ] **Step 1: Root `CLAUDE.md`** covers: what the repo is and the top-level layout; the workspace commands (`deno task dev`, `dev:*`, `generate`, `check`, `test`, `cargo test`); conventions (TypeScript: no `any`, max two positional params; Rust: `cargo fmt`, `clippy` clean, fixture tests per `backend-testing`; formatting settings); the commit format (`<type>(<scope>): <description> black-atom-industries/livery#68`, types, scope = package name or omitted; every commit green); the theme structure and token vocabulary summary from core (collections `default, jpn, terra, stations, mnml, paper`; where themes live `core/src/themes/`; adapter contract `black-atom-adapter.json` + `collection.template.*`); the sandbox rule (never run livery against the real HOME); a pointer to `.claude/skills/` naming the six skills (Task 8 creates them; list the names) and `backend-testing`. Under ~150 lines. Present tense, no history.

- [ ] **Step 2: Scoped files.** `livery/src/AGENTS.md`: frontend conventions from livery's old files that are frontend-specific (component structure, no `@tauri-apps/plugin-fs`, bindings are generated, TanStack usage). `livery/src-tauri/AGENTS.md`: backend conventions (module map, `backend-testing` pointer, bindings regeneration by `cargo test`, smoke suite `HOME` override). Each under 60 lines. Nothing that the root already says.

- [ ] **Step 3: Verify.** `find black-atom -name 'CLAUDE*.md' -o -name 'AGENTS.md' | grep -v node_modules` → exactly `black-atom/CLAUDE.md`, `black-atom/livery/src/AGENTS.md`, `black-atom/livery/src-tauri/AGENTS.md`. `deno fmt --check` clean. Every path named in the three files exists (`grep -o` the backticked paths and `test -e` each).

- [ ] **Step 4: Commit** (orchestrator): `docs: root CLAUDE.md and scoped livery AGENTS.md black-atom-industries/livery#68`

---

### Task 8: Six skills (six parallel subagents)

**Files:**

- Create: `black-atom/.claude/skills/<name>/SKILL.md` for `new-theme`, `new-adapter`, `rename-theme`, `rename-token`, `add-capability`, `release`
- Delete: `black-atom/core/.agents/`, `black-atom/core/.claude/skills`, `black-atom/adapters/*/.claude/skills`, `black-atom/livery/.claude/` (after Task 7 moved `backend-testing`), `black-atom/livery/.agents/` if present.

Each subagent loads `dev-setup-skill` and `my-voice`, reads the old skills under the source repos' `.claude/skills/` and `.agents/skills/` as reference only, and writes one skill from scratch for the monorepo layout. Every path in a skill must exist in `black-atom/` (or be a path the skill itself creates, stated as such). Frontmatter `name`, `description`. Content per skill:

- `new-theme`: design with the user (collection, name, dark/light, primaries/palette rules from `core/src/themes/`), add the theme definition file and register it in core's types/lists (name the exact files after reading `core/src/themes/` and `core/src/types/theme.ts`), add it to every adapter's `black-atom-adapter.json` collections, `deno task generate`, verify output files exist for all ten adapters, commit.
- `new-adapter`: research the app's theme format, map tokens, create `adapters/<name>/{black-atom-adapter.json,deno.json,README.md,themes/<collection>/collection.template.<ext>}`, add to root `deno.json` workspace, generate, register in livery (`livery/src-tauri/src/...` registry + updater — name the real files after reading them), tests, commit.
- `rename-theme`: across `core/src/themes/`, `core/src/types/theme.ts`, every adapter config, generated files (regenerate rather than rename by hand), livery defaults; one commit.
- `rename-token`: across `core/src/types/`, every `collection.template.*`, regenerate, one commit.
- `add-capability`: core logic in `livery/src-tauri` (Phase 4 moves it to `livery/core`, write the skill for the current layout and mark the future path in one line), CLI command (Phase 4; say "when `livery/cli` exists"), GUI surface, `#[tauri::command]` wrapper + `collect_commands!`, bindings regeneration by `cargo test`, tests, in that order.
- `release`: regenerate, run the full check set, verify `cd livery && deno task build` bundle, release-please flow (config lands in Phase 5; describe the manifest-driven flow generically and name `release-please-config.json` at the root), tag, artifacts.

- [ ] **Verify:** six `SKILL.md` files exist; `deno fmt --check` clean; each skill's backticked paths exist (`grep -oE '`[^`]+`'`filtered to path-like strings,`test -e`), except paths the skill explicitly creates or names as Phase 4/5. Root`CLAUDE.md` lists all six.

- [ ] **Commit** (orchestrator, one commit): `docs: six workflow skills for the monorepo black-atom-industries/livery#68`

---

### Task 9: CI workflow

**Files:**

- Create: `black-atom/.github/workflows/ci.yml`

- [ ] **Step 1: Workflow**

```yaml
name: ci
on:
    push:
        branches: [main]
    pull_request:
jobs:
    deno:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: denoland/setup-deno@v2
              with:
                  deno-version: v2.x
            - run: deno install
            - run: deno fmt --check
            - run: deno lint
            - run: deno check
            - run: deno test -P
    rust:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - run: sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libxdo-dev libssl-dev patchelf
            - uses: dtolnay/rust-toolchain@stable
            - uses: Swatinem/rust-cache@v2
            - run: cargo fmt --all --check
            - run: cargo clippy --workspace -- -D warnings
            - run: cargo test --workspace
```

If `cargo clippy -- -D warnings` fails locally on livery today, keep the step but drop `-D warnings` and note it in the report; do not fix clippy warnings in this task.

- [ ] **Step 2: Verify locally** — `cargo fmt --all --check` and `cargo clippy --workspace` from `black-atom/`; report the result. `deno fmt --check .github/` clean.
- [ ] **Step 3: Commit** (orchestrator): `ci: one workflow for deno and cargo checks black-atom-industries/livery#68`

---

### Task 10: Phase gate (orchestrator)

- [ ] `deno check && deno lint && deno fmt --check && deno test -P && cargo test` from `black-atom/`, all green; counts recorded.
- [ ] `grep -rn "jsr:@black-atom/core" black-atom --include=deno.json | grep -v node_modules` → only adapters' generate/dev/update tasks.
- [ ] Old repos untouched: `git -C <old> status --porcelain` empty for all twelve.
- [ ] `dev-audit` (arch + docs) over the phase diff; fix findings.
- [ ] Reviewer subagent (sonnet) reviews the tree against this plan; act on real findings.
- [ ] `gh repo create black-atom-industries/black-atom --public --source . --push` (first push), then watch `gh run list` until CI is green; fix and push again if red.
- [ ] Update `MIGRATION.md`: Phase 2, Next 2.1.
