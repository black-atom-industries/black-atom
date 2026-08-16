One adapter's row in the **ApplyRail** — the right-docked vertical successor to the horizontal ApplyStrip (spec: `Livery Explorations.dc.html#3f`). The rail scales vertically as the adapter count grows; this row is its repeating unit.

```jsx
<AdapterStatusRow name="ghostty" status="ok"      durationMs={61} />
<AdapterStatusRow name="delta"   status="running" cursored />
<AdapterStatusRow name="lazygit" status="pending" />
<AdapterStatusRow name="ghostty" status="warn"
  message="config patched · live reload failed — restart ghostty" />
<AdapterStatusRow name="obsidian" status="error" cursored expanded
  message="ENOENT: themes directory not found. Point THEMES_PATH at the vault or disable the adapter."
  path="~/.config/obsidian/themes/black-atom.css" code="LVR-102"
  onRetry={retryObsidian} />
```

- Layout: `StatusPip` (8px) + mono `name` (flex) + right-aligned `durationMs` (tabular; `—` while pending/running).
- Pip intent tracks `status`: pending = hollow, running = cream fill, ok = green, warn = amber, error = rust.
- `cursored` = subtle fill + **2px positive left edge** (compensate padding-left by 2px; radius stays 0).
- **warn = DEGRADED** — a second line under the name previews `message` in hint fg, truncated with ellipsis.
- **error** — collapsed shows an `ERR` tag; `⏎`/click sets `expanded`, pushing rows down (no overlay) to reveal a recessed detail block: full `message`, `path` + `code` as `KVRow`s, and a `[ r RETRY FAILED ]` `Button`.
- No icons, no spinners, 0 radius, 1px borders, tokens only. Compose from `StatusPip`, `KVRow`, `Button`.
