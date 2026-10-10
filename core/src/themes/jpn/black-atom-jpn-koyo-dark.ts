import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.2, 0.036, 315.74),
        d20: oklch(0.24, 0.034, 315.84),
        d30: oklch(0.32, 0.035, 316.52),
        d40: oklch(0.38, 0.036, 315.08),

        m10: oklch(0.45, 0.042, 300),
        m20: oklch(0.55, 0.046, 300),
        m30: oklch(0.6, 0.05, 75),
        m40: oklch(0.7, 0.05, 75),

        l10: oklch(0.8, 0.05, 75),
        l20: oklch(0.85, 0.05, 75),
        l30: oklch(0.875, 0.05, 75),
        l40: oklch(0.925, 0.05, 75),
    },
    accents: {
        a10: oklch(0.75, 0.15, 75),
        a20: oklch(0.75, 0.15, 50),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.65, 0.15, 10),
            red: oklch(0.75, 0.15, 15),

            darkGreen: oklch(0.65, 0.1, 150),
            green: oklch(0.75, 0.1, 150),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.75, 0.075, 350),
            blue: oklch(0.75, 0.075, 300),

            darkMagenta: oklch(0.65, 0.1, 51),
            magenta: oklch(0.75, 0.1, 51),

            darkCyan: oklch(0.65, 0.1, 180),
            cyan: oklch(0.75, 0.1, 180),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
