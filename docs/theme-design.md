# Theme design

How a Black Atom theme takes its colors, and how to check contrast. For the token model, see [`colors.md`](colors.md). For how colors reach a tool, see
[`adapter-guide.md`](adapter-guide.md).

## Designing a theme

- A color present in both appearances keeps its hue. The dark variant is one lightness step brighter, usually with a
  little less chroma. Compare a dark and light sibling in the collection to see the step it uses. This holds for accents
  and for palette colors set in an override.
- Reference material (photos, products, palettes) is sampled and used as it is, apart from that lightness step. Never
  shift lightness, chroma, or hue to fix contrast.
- A sampled neutral surface can read differently at another lightness. The TR-1000 panel measures at hue 267 and chroma
  0.025, and at its own lightness it looks gray. The same tint looks blue on a dark ground. Neutral grounds are judged by
  how the object looks, and dark grounds stay near neutral. Over-saturated tones in dark themes tend to look wrong.
- Emissive samples such as LEDs have blown-out centers. Sample the saturated edge, not the core.
- A palette's accent-linked slots either all reuse accents or none do, in both appearances. To change a linked color,
  change the accent.

## Contrast

`npm run contrast <theme-key>` lists every Contrast Pair with its WCAG ratio. The Theme Detail Page (`npm run dev`, then
`/black-atom/themes/<short-key>`) shows the theme's previews next to its base revision, `HEAD` by default. Judge by eye there.

- A theme's identity outranks the number. A signature accent keeps its value even below 3:1, because darkened oranges
  and yellows turn red, brown, or olive. Monochrome themes keep their grays gray.
- Darken with saturation. A color that gets darker on a light ground, or lighter on a dark one, also gets more chroma,
  so it stays lively.
- Chroma raises perceived contrast. The WCAG ratio only measures luminance and barely moves with chroma, but a saturated
  color looks brighter and separates more from its ground. Lowering chroma can weaken a color by eye while its number
  stays the same, so judge chroma changes on the Theme Detail Page, not by the ratio.
- 3:1 guides syntax and terminal colors. Feedback and git text aims for 4.5:1 on `bg.default` and clearly above 3:1 on
  its own tint.
- Fills are exempt: cursor, badges, selection, and `fg.accent` used as a fill. `fg.disabled` is meant to be faint.
- Light diff backgrounds are dedicated pastels: `oklch(0.9, 0.07, h)` for add and modify, and `oklch(0.93, 0.04, h)` for
  delete, with `h` the git color's hue. Feedback tints sit at about 15% on light grounds and 20 to 30% on dark ones.
  `pastel` in a collection's `create-ui-light.ts` holds the pattern.
- A gray ladder keeps even steps. When one step moves, its neighbors move too.

## Adding a collection

The procedure, with every file a new collection touches, is in
[`.agents/skills/repo-new-collection/SKILL.md`](../.agents/skills/repo-new-collection/SKILL.md). The design rules above apply
to its themes.
