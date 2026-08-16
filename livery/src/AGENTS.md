# Livery frontend

The frontend is the orchestrator. It owns UI, state, and calling order, then delegates every OS
operation to Rust through `invoke()`.

No filesystem access from TypeScript. `@tauri-apps/plugin-fs` is off limits: file reads and writes
go through Rust commands so the home-directory check and the atomic write path always apply. No
shell commands either.

## Stack

React 19 on Vite via `@deno/vite-plugin`. TanStack Query for server state, TanStack Store for client
state, TanStack Router for routing. CSS Modules with CVA, design tokens as `--ba-*` custom
properties in `styles/`.

## Generated files

- `bindings.ts` — tauri-specta output. `cargo test` regenerates it. Never edit it.
- `routeTree.gen.ts` — the TanStack Router plugin writes it during dev and build.

## Structure

- `routes/` — route components own state, fetch data, and orchestrate. The route is the container.
- `components/` — props in, UI out, no data fetching. One component per folder:
  `components/<name>/<name>.tsx`, `<name>.module.css`, `index.ts`.
- `components/layouts/` — page-level shells.
- `queries/` — TanStack Query hooks and keys.
- `store/` — TanStack Store slices.
- `lib/` — pure logic.

One component per file, file name matches the export. `kebab-case` for files and directories. `.ts`
for logic, `.tsx` for JSX.

Tests sit next to the code they cover: `foo.ts` gets `foo_test.ts`. Assertions from `@std/assert`.
