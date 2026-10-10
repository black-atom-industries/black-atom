import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.16, 0.035, 200),
        d20: oklch(0.2, 0.035, 190),
        d30: oklch(0.24, 0.035, 180),
        d40: oklch(0.36, 0.035, 170),

        m10: oklch(0.4, 0.05, 160),
        m20: oklch(0.5, 0.05, 150),
        m30: oklch(0.6, 0.05, 140),
        m40: oklch(0.7, 0.05, 130),

        l10: oklch(0.75, 0.05, 90),
        l20: oklch(0.8, 0.05, 85),
        l30: oklch(0.85, 0.05, 80),
        l40: oklch(0.92, 0.05, 75),
    },
    accents: {
        a10: oklch(0.75, 0.095, 100),
        a20: oklch(0.75, 0.095, 60),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.7, 0.075, 10),
            red: oklch(0.7, 0.075, 40),

            darkGreen: oklch(0.6, 0.1, 130),
            green: oklch(0.7, 0.1, 120),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.6, 0.05, 150),
            blue: oklch(0.7, 0.05, 150),

            darkMagenta: oklch(0.6, 0.05, 330),
            magenta: oklch(0.7, 0.05, 360),

            darkCyan: oklch(0.6, 0.075, 175),
            cyan: oklch(0.7, 0.075, 175),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
