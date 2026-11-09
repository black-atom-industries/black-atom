import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.19, 0.008, 274),
        d20: oklch(0.23, 0.008, 274),
        d30: oklch(0.28, 0.008, 274),
        d40: oklch(0.33, 0.008, 274),

        m10: oklch(0.52, 0.025, 267),
        m20: oklch(0.57, 0.025, 267),
        m30: oklch(0.63, 0.025, 267),
        m40: oklch(0.68, 0.025, 267),

        l10: oklch(0.8, 0.01, 267),
        l20: oklch(0.86, 0.01, 267),
        l30: oklch(0.91, 0.01, 267),
        l40: oklch(0.96, 0.01, 267),
    },
    accents: {
        a10: oklch(0.75, 0.1, 265),
        a20: oklch(0.75, 0.12, 20),
        a30: oklch(0.75, 0.12, 285),
        a40: oklch(0.75, 0.12, 130),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: accents.a20,
            red: accents.a20,

            darkGreen: accents.a40!,
            green: accents.a40!,

            darkYellow: accents.a30!,
            yellow: accents.a30!,

            darkBlue: primaries.m40,
            blue: primaries.l20,

            darkMagenta: accents.a30!,
            magenta: accents.a30!,

            darkCyan: accents.a10,
            cyan: accents.a10,
        }),
    feedback: createFeedback,
    ui: createUi,
    syntax: createSyntax,
});
