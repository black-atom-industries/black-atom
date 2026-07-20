import type { ThemeAccentColors, ThemeDefinition, ThemePrimaryColors } from "../../types/theme.ts";
import { themeKeyMetaMap } from "../../types/themes.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

const meta = themeKeyMetaMap["black-atom-default-light-dimmed"];

const primaries: ThemePrimaryColors = {
    d10: oklch(0.12, 0.012, 250),
    d20: oklch(0.18, 0.012, 250),
    d30: oklch(0.24, 0.012, 250),
    d40: oklch(0.30, 0.012, 250),

    m10: oklch(0.40, 0.012, 250),
    m20: oklch(0.46, 0.012, 250),
    m30: oklch(0.52, 0.012, 250),
    m40: oklch(0.58, 0.012, 250),

    l10: oklch(0.75, 0.012, 250),
    l20: oklch(0.85, 0.012, 250),
    l30: oklch(0.90, 0.012, 250),
    l40: oklch(0.94, 0.012, 250),
};

const accents: ThemeAccentColors = {
    a10: oklch(0.67, 0.15, 155),
    a20: oklch(0.62, 0.15, 145),
    a30: oklch(0.67, 0.15, 265),
    a40: oklch(0.67, 0.15, 365),
};

const palette = createPalette(primaries, {
    override: (palette) => ({
        ...palette,
        cyan: accents.a10,
        darkCyan: accents.a20,
        magenta: accents.a30 ?? accents.a10,
        darkMagenta: accents.a40 ?? accents.a10,
    }),
});

const feedback = createFeedback();
const options = { primaries, palette, feedback, accents };

const theme: ThemeDefinition = {
    meta,
    primaries,
    palette,
    accents,
    feedback,
    ui: createUi(options),
    syntax: createSyntax(options),
};

export default theme;
