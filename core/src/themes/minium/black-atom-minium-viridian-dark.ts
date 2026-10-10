import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.3, 0.045, 170),
        d20: oklch(0.34, 0.05, 170),
        d30: oklch(0.38, 0.055, 170),
        d40: oklch(0.42, 0.065, 170),

        m10: oklch(0.55, 0.08, 170),
        m20: oklch(0.64, 0.08, 170),
        m30: oklch(0.72, 0.08, 170),
        m40: oklch(0.8, 0.08, 170),

        l10: oklch(0.84, 0.045, 170),
        l20: oklch(0.88, 0.035, 170),
        l30: oklch(0.94, 0.025, 170),
        l40: oklch(0.98, 0.0125, 170),
    },
    accents: {
        a10: oklch(0.75, 0.125, 50),
        a20: oklch(0.75, 0.125, 150),
        a30: oklch(0.75, 0.125, 70),
        a40: oklch(0.75, 0.125, 170),
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
