import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.3, 0.045, 183),
        d20: oklch(0.34, 0.05, 183),
        d30: oklch(0.38, 0.055, 183),
        d40: oklch(0.407, 0.073, 183),

        m10: oklch(0.55, 0.08, 183),
        m20: oklch(0.64, 0.08, 183),
        m30: oklch(0.72, 0.08, 183),
        m40: oklch(0.8, 0.08, 183),

        l10: oklch(0.84, 0.045, 183),
        l20: oklch(0.88, 0.035, 183),
        l30: oklch(0.94, 0.025, 183),
        l40: oklch(0.98, 0.0125, 183),
    },
    accents: {
        a10: oklch(0.737, 0.112, 40),
        a20: oklch(0.75, 0.125, 150),
        a30: oklch(0.75, 0.125, 70),
        a40: oklch(0.75, 0.125, 183),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            debug: false,
            override: (palette) => ({
                ...palette,
                green: accents.a20,
                darkGreen: accents.a20,
                yellow: accents.a30!,
                darkYellow: accents.a30!,
                darkCyan: accents.a40!,
                cyan: accents.a40!,
                magenta: oklch(0.85, 0.05, 365),
                darkMagenta: oklch(0.75, 0.05, 365),
            }),
        }),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
