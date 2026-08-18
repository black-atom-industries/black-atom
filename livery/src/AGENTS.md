# Livery frontend

The frontend is the orchestrator. It owns UI, state, and calling order, then delegates every OS
operation to Rust through `invoke()`.

Repo-wide instructions live in [`AGENTS.md`](../../AGENTS.md); every term is defined in
[`GLOSSARY.md`](../../GLOSSARY.md). Name things with those words. Component architecture and
folder conventions come from the `dev-style-react` and `dev-style-tanstack` skills.

No filesystem access from TypeScript. `@tauri-apps/plugin-fs` is off limits: file reads and writes
go through Rust commands so the home-directory check and the atomic write path always apply. No
shell commands either.

## Generated files

- `bindings.ts` — tauri-specta output. `cargo test` regenerates it. Never edit it.
- `routeTree.gen.ts` — the TanStack Router plugin writes it during dev and build.

## Structure

- `routes/` — route components own state, fetch data, and orchestrate. The route is the container.
- `components/` — props in, UI out, no data fetching.
- `queries/` — TanStack Query hooks and keys.
- `store/` — TanStack Store slices, client state only. Anything the backend owns is a query.
- `lib/` — pure logic.

Design tokens are `--ba-*` custom properties in `styles/`; chrome expresses color, type, spacing,
borders and motion through them and nothing else.

Tests sit next to the code they cover: `foo.ts` gets `foo_test.ts`. Assertions from `@std/assert`.
