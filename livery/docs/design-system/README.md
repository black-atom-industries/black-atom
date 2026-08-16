# Black Atom Design System — vendored reference

Read-only snapshot of the Claude Design project
[**Black Atom Design**](https://claude.ai/design/p/4b417984-1925-4a6f-99db-5f781d14f07c) ("Warm
Precision"), vendored so every working session can read the spec locally — offline, diffable,
renderable. Adopted via epic [#49](https://github.com/black-atom-industries/livery/issues/49).

## Source of truth

- **Design iteration** happens in the Claude Design project, never here.
- **`reference/` is never hand-edited.** It changes only by re-import (see below).
- Livery's implementation follows this reference; where code must deviate, the deviation is
  documented in [DESIGN.md](../../DESIGN.md), not patched into the snapshot.

## Layout

| Path                                    | What it is                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `reference/readme.md`                   | The system's own overview — language, foundations, copy register. Start here.                    |
| `reference/tokens/`                     | Canonical `--ba-*` token files (colors, typography, spacing, borders, motion).                   |
| `reference/components/`                 | 17 primitive specs — `.jsx` + `.d.ts` + `.prompt.md` per component, plus per-category card HTML. |
| `reference/guidelines/`                 | Foundation specimen cards (renderable HTML).                                                     |
| `reference/ui_kits/livery/index.html`   | Static recreation of the main view — open it in a browser.                                       |
| `reference/Livery Explorations.dc.html` | The original exploration board: main view, settings, progress, empty/error states, light mode.   |
| `reference/refs/`, `reference/uploads/` | Reference images.                                                                                |
| `screenshots/`                          | PNG captures of the rendered board and UI kit, taken at import time.                             |

## Re-import procedure

1. In a Claude Code session, authorize design access (`/design-login`).
2. Fetch every file of the design project (DesignSync MCP, project id
   `4b417984-1925-4a6f-99db-5f781d14f07c`) and replace `reference/` **wholesale** — no merging.
3. Re-capture `screenshots/`.
4. Review the git diff of `reference/` to see what the design changed; file follow-up issues against
   the epic for code that must catch up.
