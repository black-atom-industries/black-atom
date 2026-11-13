import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.2, 0.008, 274),
        d20: oklch(0.25, 0.008, 274),
        d30: oklch(0.33, 0.008, 274),
        d40: oklch(0.38, 0.008, 274),

        m10: oklch(0.42, 0.025, 267),
        m20: oklch(0.47, 0.025, 267),
        m30: oklch(0.52, 0.025, 267),
        m40: oklch(0.66, 0.025, 267),

        l10: oklch(0.8, 0.012, 267),
        l20: oklch(0.84, 0.012, 267),
        l30: oklch(0.9, 0.012, 267),
        l40: oklch(0.94, 0.012, 267),
    },
    accents: {
        a10: oklch(0.55, 0.15, 265),
        a20: oklch(0.55, 0.15, 20),
        a30: oklch(0.55, 0.15, 285),
        a40: oklch(0.55, 0.15, 130),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: accents.a20,
            red: accents.a20,

            darkGreen: accents.a40!,
            green: accents.a40!,

            darkYellow: accents.a30!,
            yellow: accents.a30!,

            darkBlue: primaries.m20,
            blue: primaries.m10,

            darkMagenta: accents.a30!,
            magenta: accents.a30!,

            darkCyan: accents.a10,
            cyan: accents.a10,
        }),
    feedback: createFeedback,
    ui: createUi,
    syntax: createSyntax,
});
