# Migration state

Phase: 1
Last completed task: 1.1 trees copied
Next: 1.2 deno workspace (fix pass running: core Timeout types, palette test fixture path, livery React 19)
Blocked on Nik: (none)
Decisions made in-run:

- 2026-08-16 core's org-dir resolution and per-adapter git calls are re-pointed/removed in Phase 1 (task 1.4) so no dev task can write into the old checkouts.
- 2026-08-16 baseline counts are 100 Rust tests (brief says 101) and 70 TS tests.
- 2026-08-16 15:15 livery moves to React 19: monitor is on 19 and shares `@base-ui/react` and TanStack versions with livery, so one workspace dedups them onto React 19 types and livery's check breaks on 18. Nik confirmed at 15:17: dependencies may be updated and React 19 features used where a touched line benefits.

Follow-up issues filed: (none)
