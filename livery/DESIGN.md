# Livery UI Design Language — "Warm Precision"

## Summary

Design language for Black Atom Livery — a theme management desktop app (Tauri v2). 1970s NASA /
DHARMA / technical-datasheet visual language: bordered boxes, monospace labels, vintage authority.
Warmth comes from color temperature and copy, never from soft shapes.

**Canonical spec:** [`docs/design-system/`](docs/design-system/README.md) — a vendored, renderable
snapshot of the Black Atom Design project (tokens, 17 component specs, guideline specimens, the
exploration board). This document records the adopted decisions and the rules of the language; where
detail matters (exact tokens, component anatomy), the reference wins.

Adopted via epic [#49](https://github.com/black-atom-industries/livery/issues/49).

## Design DNA

### Aesthetic References

- DHARMA Initiative (Lost) — mysterious corporate identity, vintage badges
- NASA 1970s identity — technical type, worm/meatball duality
- Technical datasheets / RFC-style schematics — the existing black-atom.industries website shares
  this language (bordered sections, monospace, datasheet layout)
- Reference images: `docs/design-system/reference/refs/`

### Typography — Three Voices

Vendored via Fontsource (static weights 400/500/700, family names match the tokens):

- **Display (Space Grotesk 700):** Headlines, theme names, page titles. Tight tracking (−0.01em),
  uppercase or Title Case. Used sparingly — the exception, not the default.
- **Mono (Iosevka) — the DEFAULT interface voice:** ALL labels, navigation, status text, section
  headers, form values, metadata, keyboard hints. Uppercase section labels carry 0.14em
  letterspacing. Anything that is chrome is mono.
- **Body (IBM Plex Sans):** Prose only — descriptions, help text. 1.7 leading, ≤65ch measure,
  sentence case.

**Hierarchy through contrast:** massive display next to tiny mono metadata — the datasheet effect.

History: Berkeley Mono (TX-02) was the original mono target; its license prohibits app bundling
(EULA §1.14, §9; black-atom-industries/ui#5 unresolved). JetBrains Mono served as interim until the
design pass settled on Iosevka.

### Color System

- **Chrome is warm monochrome.** Warm charcoal in dark (`oklch ~0.18, hue 30`), warm cream in light
  (`~0.95, hue 30`). No pure black or white.
- **One accent.** Muted green (`--ba-color-fg-positive`) for positive/synced/focus/selection.
  Intents: muted amber (warn), rust (negative), slate blue (info). Intents are foreground-only —
  pips, labels, outlines; there are no intent background tokens.
- **Themes are the color.** Saturated color appears exclusively as theme content — swatches, bands,
  palette pips, code previews. Chrome never competes.
- **Chrome re-tints at runtime.** The ThemeProvider overrides the `--ba-*` bg/fg tokens with the
  selected theme's `ui` palette (`src/lib/tokens.ts` documents the role mapping). Borders and focus
  derive from foreground via `color-mix`, so they follow automatically. Components consume tokens,
  never hex.

### Tokens

Single brand-wide namespace: `--ba-*`, defined in `src/styles/tokens/` — the five category files
(colors, typography, spacing, borders, motion) mirror `docs/design-system/reference/tokens/` 1:1 and
change only via design re-import. `layers.css` (z-index) is app-local. There are deliberately NO
shadow or radius scales — banned properties have no tokens.

### Surfaces & Borders

- Depth via tonal layering only: recessed (inputs/code) < default (page) < subtle (panels/bars) <
  hint (selection). No shadows, no gradients, no blur.
- 1px solid borders everywhere — the datasheet box aesthetic. Borders derive from foreground (18% /
  10% / 45% mixes), so they re-tint with the theme.
- **0px border-radius.** Sole exception: the brand dot (`--ba-radius-dot`).

### States

- Hover = one surface tier lighter (80ms ease-out)
- Keyboard focus = 1px positive outline at 2px offset (`--ba-focus-outline`/`--ba-focus-offset`)
- Selection = hint surface + 2px positive left edge (`--ba-selection-edge`), or full contrast
  inversion
- Editing = positive border + block caret

### Motion

Austere. ≤150ms ease-out for state changes; panel expand/collapse caps at 240ms. Progress bars are
3px and animate width only. No bounces, no entrance animations, no fades over 200ms.

### Iconography

**There are no decorative icons.** Unicode glyphs as functional symbols: `›` (selection cursor), `»`
(prompt), `■` (status), `↑ ↓ ⏎` (keys), `◐ ● ○` (appearance), `·` (separator). Square pips (plain
divs) for status; bordered letter tags (`D`/`L`) for appearance. No icon font, no SVG icon set, no
emoji. If a glyph can't say it, a mono label does.

### Signature Motifs

- Bracket actuators: `[ LABEL ]` — the visual signature for interactive elements
- Square status pips (8px) + mono label; mini palette pips (4×7px) on list rows
- Block cursor `»` prompts
- `n/m` counters (`SYNCED 8/8`, `2/24`)
- Uppercase mono section labels with a hairline rule to the right
- Document/revision codes (`DOC LVR-JPN-KY-D · REV 03`)

## Copy Register

Technical documentation voice. Terse, factual, confident — instrument-panel captions, not marketing.

- **Casing:** chrome text is UPPERCASE mono with letterspacing (`SEMANTIC · FEEDBACK`,
  `APPLYING KOYO YORU`). Body prose is sentence case. Theme names are Title Case.
- **Separators:** middle dot `·` joins facts; em-dash `—` introduces qualifiers
  (`■ APPLIED — KOYO YORU`). Counts as `n/m`.
- **Voice:** imperative and impersonal. "Select any theme with j/k and press ⏎." Never "we", rarely
  "you". No exclamation marks.
- **Keyboard-first:** every action names its key (`[ r RETRY FAILED ]`, `esc DISMISS`). The footer
  always shows the key vocabulary.
- Personality in small doses: taglines (`PAINT YOUR COCKPIT`), document codes.

## Component Patterns

The 17 primitives are specified in `docs/design-system/reference/components/` (actions, forms,
display, containers) — each with `.jsx` spec, prop types, and prompt notes. They map to the
component architecture: dumb components own styling, routes own data and orchestration, layouts
handle structure.

## Anti-Patterns (Banned)

- No border-radius (0px is the rule; sole exception: the brand dot)
- No shadows of any kind (depth through tonal layering only)
- No gradients, no blur/transparency effects
- No saturated or neon color in chrome — only theme content brings color
- No pure black (`#000000`) or pure white (`#FFFFFF`)
- No emoji in the interface
- No icons — unicode glyphs + mono labels only
- No centered hero layouts (asymmetric, left-aligned; split panels with hard 1px seams)
- No hardcoded hex in components — chrome consumes `--ba-*` tokens
- No generic AI copywriting ("Elevate", "Seamless", "Next-Gen"), no filler UI text
- No bounces, entrance animations, or slow fades

## Screens

Canonical compositions live on the exploration board
(`docs/design-system/reference/Livery Explorations.dc.html`) — index: 2a main view (dark + light),
2b filter popup, 3a adapter settings, 3b general settings, 3c apply progress, 3d empty & error, 3e
component inventory, 4a color model / token map. The static UI-kit recreation of the main view is
`docs/design-system/reference/ui_kits/livery/index.html`.

- **Main View:** split panel — grouped theme list (collection headers, palette pips, `n/m` counts) |
  theme datasheet (display-voice name, swatch bands/grids, KV rows, code preview, doc-code footer).
  Keyboard hints in the footer.
- **Settings:** disclosure panels of forms primitives, same datasheet language.
- **Apply progress / empty / error:** per-updater status pips, `n/m` counters, named recovery keys.

## Logo Direction

No official logo yet. The wordmark sets `BLACK AT●M` in Space Grotesk 700 with a 0.62em filled
circle standing in for the O — the literal "black atom", and the only circle in the system. Do not
draw any other mark.

## Light / Dark Appearance

Both first-class. Appearance switching affects chrome tokens only (`[data-ba-color-scheme]` +
`light-dark()`); theme palettes remain content. The structure never changes between appearances.
