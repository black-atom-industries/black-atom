import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.202, 0.05, 47.49),
        d20: oklch(0.301, 0.049, 48.35),
        d30: oklch(0.348, 0.05, 49.42),
        d40: oklch(0.438, 0.05, 49.73),

        m10: oklch(0.483, 0.075, 48.75),
        m20: oklch(0.569, 0.074, 49.6),
        m30: oklch(0.655, 0.075, 48.42),
        m40: oklch(0.742, 0.075, 49.01),

        l10: oklch(0.829, 0.055, 58.77),
        l20: oklch(0.872, 0.048, 58.95),
        l30: oklch(0.914, 0.042, 61.44),
        l40: oklch(0.94, 0.038, 61),
    },
    accents: {
        a10: oklch(0.656, 0.16, 54.87),
        a20: oklch(0.622, 0.17, 34.94),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.476, 0.15, 29.67),
            red: oklch(0.523, 0.15, 29.5),

            darkGreen: oklch(0.453, 0.08, 128.52),
            green: oklch(0.499, 0.08, 127.36),

            darkYellow: accents.a20,
            yellow: oklch(0.615, 0.16, 54.87),

            darkBlue: oklch(0.464, 0.07, 51.31),
            blue: oklch(0.512, 0.08, 49.91),

            darkMagenta: oklch(0.575, 0.1, 41.63),
            magenta: oklch(0.61, 0.1, 40.86),

            darkCyan: oklch(0.556, 0.08, 175.39),
            cyan: oklch(0.592, 0.08, 175),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
