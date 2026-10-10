import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.26, 0.021, 325),
        d20: oklch(0.32, 0.027, 325),
        d30: oklch(0.38, 0.043, 325),
        d40: oklch(0.45, 0.049, 325),

        m10: oklch(0.5, 0.05, 325),
        m20: oklch(0.6, 0.05, 325),
        m30: oklch(0.7, 0.05, 75),
        m40: oklch(0.8, 0.05, 75),

        l10: oklch(0.9, 0.05, 75),
        l20: oklch(0.935, 0.035, 75),
        l30: oklch(0.965, 0.025, 75),
        l40: oklch(0.975, 0.025, 75),
    },
    accents: {
        a10: oklch(0.75, 0.175, 75),
        a20: oklch(0.7, 0.175, 50),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.55, 0.15, 10),
            red: oklch(0.6383, 0.225, 15.0),

            darkGreen: oklch(0.55, 0.15, 150),
            green: oklch(0.65, 0.15, 150),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.65, 0.15, 350),
            blue: oklch(0.65, 0.15, 300),

            darkMagenta: oklch(0.75, 0.15, 60),
            magenta: oklch(0.75, 0.15, 50),

            darkCyan: oklch(0.55, 0.15, 180),
            cyan: oklch(0.65, 0.15, 180),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
