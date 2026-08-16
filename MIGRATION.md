# Migration state

Phase: 2
Last completed task: 1.10 Phase 1 gate green locally (push pending, see Blocked)
Next: 2.1 adapter generate tasks invoke core in-tree
Blocked on Nik: `gh repo create black-atom-industries/black-atom --public --source . --push` is refused by the Claude Code permission classifier. Run it from `black-atom/` (or `! gh repo create ...` in the session), then CI on the first push is checked at the next gate. Phase 2 continues locally meanwhile.
Decisions made in-run:

- 2026-08-16 core's org-dir resolution and per-adapter git calls were re-pointed/removed in Phase 1 (task 1.4) so no dev task can write into the old checkouts.
- 2026-08-16 baseline counts: 100 Rust tests (brief says 101); TS 70 livery + 51 core/monitor at copy time, 109 after core's `org_test.ts` went with the `org` task.
- 2026-08-16 15:15 livery moves to React 19: monitor is on 19 and shares `@base-ui/react` and TanStack versions with livery, so one workspace dedups them onto React 19 types and livery's check breaks on 18. Nik confirmed at 15:17: dependencies may be updated and React 19 features used where a touched line benefits.
- 2026-08-16 15:30 in-tree generation invocation: `deno run -A <core>/src/cli/index.ts generate` with cwd = adapter dir (plain form; `--config` pointing at a member is not needed inside the workspace).
- 2026-08-16 15:40 Phase 1 reviews (sonnet + Codex) flag stale multi-repo docs in `core/README.md`, `core/docs/adapter-generation-architecture.md`, `core/docs/adapter_development-guide.md`, `core/src/cli/index.ts` help text and every adapter README. Core docs and CLI help are Phase 2 work; READMEs are Phase 5.
- 2026-08-16 15:40 `livery/src-tauri/tauri.conf.json` carries version 0.1.0 while deno.json/Cargo.toml say 0.2.0; Phase 5 adds it to release-please extra-files.

Follow-up issues filed: (none)
