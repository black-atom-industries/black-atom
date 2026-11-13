# Colors

How a theme's colors are built, what each group is for, and how they reach a tool. Terms are defined in
[`glossary.md`](glossary.md). Types live in `core/src/types/theme.ts`.

## Groups and order

A theme's `colors` come from `defineThemeColors()` (`core/src/themes/define-theme-colors.ts`). It resolves the groups in
this order:

1. **Primaries**, given directly.
2. **Accents**, from a value or a creator that receives primaries.
3. **Palette**, from a value or a creator that receives primaries and accents.
4. **Feedback**, from a value or a creator that receives primaries, accents and palette.
5. **UI** and **syntax**, from creators that receive all four groups before them.

Each creator is a plain function in the collection's directory. A theme can also pass literal values.

## Primaries

Twelve steps in three ranges: `d10` to `d40` (dark), `m10` to `m40` (mid), and `l10` to `l40` (light). They form one ramp
that both appearances use. Which step a theme takes for a role depends on the appearance: `default/create-ui-dark.ts`
takes `bg.default` from `d20`, and `default/create-ui-light.ts` takes it from `l30`.

Primaries are the raw material for the other groups. Templates do not read them, except where a target defines its own
ramp (see [`adapter-guide.md`](adapter-guide.md)).

## Accents: character

Accents carry a theme's character. `a10` and `a20` are required, and `a30` and `a40` are optional. A creator uses them
for `ui.fg.accent`, for syntax colors, and for palette slots.

A collection assigns them freely. Any accent can fill any palette slot, and a theme can leave a hue out, so a collection
can have no green at all. `jpn/create-palette-dark.ts` sets `darkYellow` from `accents.a20` and `yellow` from
`accents.a10`. `mono/create-palette-dark.ts` sets `green` and `cyan` from the same shade of `m40`.

## Feedback: function

Feedback is four status colors: `negative`, `success`, `info` and `warning`. They give diffs and status messages their
colors. They need not appear in the palette.

Feedback comes in two shapes:

- **Palette-derived.** `facility`, `jpn` and `terra` map `negative`, `success`, `info` and `warning` to the palette's
  `red`, `green`, `blue` and `yellow`.
- **Fixed literals.** `default`, `minium`, `mono` and `tr-1000` write `oklch()` values directly. A fixed `success` keeps
  its green even when the palette has none.

Feedback reaches a tool only through the UI tokens that `create-ui-*.ts` derive from it:

| Feedback   | UI foreground        | UI background (tinted) |
| ---------- | -------------------- | ---------------------- |
| `negative` | `negative`, `delete` | `negative`, `delete`   |
| `success`  | `positive`, `add`    | `positive`, `add`      |
| `info`     | `info`, `modify`     | `info`, `modify`       |
| `warning`  | `warn`               | `warn`                 |

`hint` follows `warning` in some collections and `palette.darkYellow` in others, and each collection sets its own tint ground
(`d10` or `d20` in dark). `create-ui-*.ts` holds both choices.

No template reads `theme.feedback`. A template gets a status color through a UI token, such as `theme.ui.fg.negative`.

## Palette and the terminal

A terminal has only its 16 ANSI colors. The palette holds one color per ANSI slot, and shell output takes whatever sits in
the matching slot. Output colored "green" is the theme's `darkGreen`, not its `success`.

| ANSI | Palette key   | ANSI | Palette key |
| ---- | ------------- | ---- | ----------- |
| 0    | `black`       | 8    | `gray`      |
| 1    | `darkRed`     | 9    | `red`       |
| 2    | `darkGreen`   | 10   | `green`     |
| 3    | `darkYellow`  | 11   | `yellow`    |
| 4    | `darkBlue`    | 12   | `blue`      |
| 5    | `darkMagenta` | 13   | `magenta`   |
| 6    | `darkCyan`    | 14   | `cyan`      |
| 7    | `lightGray`   | 15   | `white`     |

The `dark*` names are the normal half of the ANSI palette, and the plain names are the bright half. The table comes from
`adapters/ghostty/themes/collection.template.conf`, which maps each slot in order.

## UI and syntax

UI colors are the interface states an adapter styles: backgrounds, foregrounds, selection, search, and the status states
from feedback. Syntax colors are the highlight categories for code, nested by construct (`syntax.string.default`,
`syntax.func.method`, `syntax.markup.heading.h1`). Their exact shape is the type in `core/src/types/theme.ts`.

`ui.fg.border` is the color of idle lines: borders around panes and floats, separators between them, and indent guides.
It sits at about 2:1 against `ui.bg.default`, visible and behind the content, so it stays out of the contrast pairs,
which measure readable text. A focused or active border uses `ui.fg.accent`, a border that reports a state uses that
state's color, and marks that are read as text (line numbers, whitespace marks) use `ui.fg.subtle`.

## Appearances

Each theme has one `meta.appearance`, `"dark"` or `"light"`. A collection's creators come in dark and light pairs
(`create-ui-dark.ts` and `create-ui-light.ts`, and the same for the other groups), so each appearance can use its own
values from the same accents and primaries.

## Utilities

`core/src/utils/color.ts` provides four functions:

- `oklch(l, c, h)` builds a `HexColor` from OKLCH values.
- `tint({ color, with, amount })` blends `color` toward `with` in OKLCH, with `amount` defaulting to 0.25. It neutralizes
  the base's chroma and keeps the tint's hue, so warm tints do not pass through unrelated hues.
- `mix({ color, into, amount })` mixes `amount` of `color` into `into` in OKLab and keeps the base's tone, so a small
  amount stays close to the base.
- `shade(color, amount)` moves lightness and keeps chroma and hue.
