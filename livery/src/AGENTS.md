# Frontend (TypeScript / React / Deno)

The TypeScript frontend is the **orchestrator** — manages UI, state, and calling order. Decides
_what_ to do, then delegates to Rust via `invoke()`.

## Stack

- **Runtime:** Deno
- **Framework:** React (via Vite + `@deno/vite-plugin`)
- **Styling:** CSS Modules + CVA, `--ba-*` CSS custom properties for design tokens
- **State:** TanStack Query (server state), TanStack Store (client state)
- **Routing:** TanStack Router

## Conventions

> Full frontend conventions are pending — see
> [DEV-318](https://linear.app/black-atom-industries/issue/DEV-318).

- **Routes** (`src/routes/`): Own state, fetch data, orchestrate logic — the route component is the
  container.
- **Components** (`src/components/`): Receive props, render UI. No data fetching. Folder convention:
  `components/<name>/<name>.tsx` + `<name>.module.css` + `index.ts` barrel.
- **Layouts** (`src/components/layouts/`): Page-level structure shells.
- One component per file. File name matches export.
- `kebab-case` for all files and directories.
- `.ts` for pure logic, `.tsx` for JSX.
- `deno fmt` — 4-space indent, double quotes, semicolons, 100 char width.
- Test files live next to code: `foo.ts` → `foo_test.ts`. Use `@std/assert`.
