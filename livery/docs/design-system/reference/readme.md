# Black Atom Industries — Design System

**"Warm Precision"** — 1970s NASA / DHARMA / technical-datasheet visual language. Bordered boxes, monospace labels, vintage authority. Warmth comes from color temperature and copy, never from soft shapes.

## Context

Black Atom Industries is a developer-tools brand. Products represented:

- **Livery** — a desktop theme manager (Tauri v2 + React). Pick a theme once, it applies across all configured tools (Neovim, tmux, Ghostty, Zed, delta, lazygit, Obsidian, helm). Keyboard-driven, split-panel, datasheet aesthetic. The UI kit in this system recreates it.
- **@black-atom/core** — the theme collections themselves (DEFAULT, JPN, TERRA, STATIONS, CRBN, NORTH). Themes are *content* in this system: their palettes provide the only saturated color that ever appears.
- The black-atom.industries website (bordered sections, monospace, datasheet layout) shares this language.

Sources used: the `livery` codebase (mounted local folder: `DESIGN.md`, `src/styles/variables/*.css`, component sources) and the design pass in `Livery Explorations.dc.html` in this project (main view, settings, progress, empty/error states, component inventory — the canonical reference for every component here).

## Content fundamentals

- **Register**: technical documentation. Terse, factual, confident. Instrument-panel captions, not marketing.
- **Casing**: chrome text is UPPERCASE mono with letterspacing (`SEMANTIC · FEEDBACK`, `APPLYING KOYO YORU`). Body prose is sentence case. Theme names are Title Case.
- **Separators**: middle dot ` · ` joins facts; em-dash ` — ` introduces qualifiers (`■ APPLIED — KOYO YORU`). Counts as `n/m` (`SYNCED 8/8`, `2/24`).
- **Voice**: imperative and impersonal. "Select any theme with j/k and press ⏎." Never "we", rarely "you". No exclamation marks.
- **Keyboard-first**: every action names its key (`[ r RETRY FAILED ]`, `esc DISMISS`). Footer always shows the key vocabulary.
- **Banned copy**: generic AI marketing ("Elevate", "Seamless", "Next-Gen"), filler ("Scroll to explore"), emoji.
- Personality shows up in small doses: taglines like "PAINT YOUR COCKPIT", document codes like `DOC LVR-JPN-KY-D · REV 03`.

## Visual foundations

- **Color**: chrome is warm monochrome — warm charcoal in dark (`oklch ~0.18, hue 30`), warm cream in light (`~0.95, hue 30`). No pure black or white. One muted green accent for positive/synced/focus; muted amber (warn), rust (negative), slate blue (info). Saturated color comes exclusively from theme palettes displayed as content (swatches, bands, code previews). In Livery itself the chrome tokens are overwritten at runtime by the selected theme's `ui.bg/fg` — components must consume tokens, never hex.
- **Type, 3 voices**: Space Grotesk 700 = display (headlines, theme names; uppercase or Title Case, tight tracking). Iosevka = mono/UI, the default voice — ALL labels, nav, status, form values, uppercase section headers with 0.14em letterspacing. IBM Plex Sans = body prose only (descriptions, help text; relaxed 1.7 leading, ≤65ch). Hierarchy through contrast: massive display next to tiny mono metadata.
- **Surfaces**: 0px border-radius everywhere (sole exception: the brand dot). 1px solid borders. Depth via tonal layering only — recessed (inputs/code) < default (page) < subtle (panels/bars) < hint (selection). No shadows, no gradients, no blur/transparency effects.
- **Borders & rules**: borders derive from foreground (`color-mix` 18% / 10%), so they re-tint with the theme. Section headers = uppercase mono label + hairline rule to the right. Dividers are 1px, never decorative.
- **Layout**: asymmetric, left-aligned; split panels with hard 1px seams; datasheet stacking (header → bands → swatch grids → KV rows → doc footer). Never centered heroes.
- **States**: hover = one surface tier lighter. Keyboard focus = 1px positive outline at 2px offset. Selection = hint surface + 2px positive left edge, or full contrast inversion. Editing = positive border + block caret.
- **Motion**: austere. ≤150ms ease-out for state changes; progress bars are 3px and animate width only. No bounces, fades over 200ms, or entrance animations.
- **Signature motifs**: bracket actuators `[ LABEL ]`; square status pips (8px) + mono label; mini palette pips (4×7px squares) on list rows; block cursor `»` prompts; `n/m` counters; document/revision codes.

## Iconography

**There are no decorative icons.** The system uses text and geometric glyphs exclusively:

- Unicode glyphs as functional symbols: `›` (selection cursor), `»` (prompt), `■` (status), `↑ ↓ ⏎` (keys), `◐ ● ○` (appearance), `·` (separator).
- Square pips (plain divs) for status; small bordered letter tags (`D`/`L`) for appearance.
- No icon font, no SVG icon set, no emoji. If a glyph can't say it, a mono label does.

## Logo

**No official logo exists yet.** Direction (from Livery's DESIGN.md): a filled black dot — the literal "black atom" — replacing the O in the wordmark (`BLACK AT●M`). Until a mark ships, set the wordmark in Space Grotesk 700 with a 0.62em circle standing in for the O. Do not draw any other mark.

## Index

- `styles.css` — global CSS entry (imports everything below)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `borders.css`, `motion.css`
- `fonts/fonts.css` — webfont loading (CDN; see Caveats)
- `guidelines/` — foundation specimen cards (Design System tab)
- `components/` — reusable primitives: `actions/` (Button, KeyHint), `forms/` (Prompt, TextInput, Toggle, RadioGroup, Chip), `display/` (Badge, StatusPip, Swatch, SectionHeader, KVRow, ListRow, ProgressBar, CodePreview), `containers/` (DisclosurePanel, Dialog, AppHeader, AppFooter)
- `ui_kits/livery/` — Livery main-view recreation
- `SKILL.md` — agent-skill entry point
- `Livery Explorations.dc.html` — the original design board this system was distilled from

## Caveats / intentional decisions

- Token prefix is `--ba-*` (brand-wide). Livery's codebase currently uses `--lvr-*` with the same semantic names — a mechanical rename on adoption.
- Fonts load from CDN (Google Fonts + Fontsource Iosevka), not bundled binaries. For offline/Tauri bundling, vendor the woff2 files and update `fonts/fonts.css`.
- Theme palette data (Koyo Yoru etc.) shown in specimens is plausible stand-in, not canonical `@black-atom/core` values.
