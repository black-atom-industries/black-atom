import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.251, 0.005, 232),
        d20: oklch(0.312, 0.005, 232),
        d30: oklch(0.394, 0.006, 232),
        d40: oklch(0.438, 0.007, 232),

        m10: oklch(0.543, 0.012, 205),
        m20: oklch(0.59, 0.014, 205),
        m30: oklch(0.679, 0.015, 205),
        m40: oklch(0.753, 0.015, 205),

        l10: oklch(0.927, 0.011, 215),
        l20: oklch(0.955, 0.012, 215),
        l30: oklch(0.981, 0.009, 215),
        l40: oklch(1, 0, 0),
    },
    accents: {
        a10: oklch(0.8, 0.186, 119),
        a20: oklch(0.75, 0.135, 82.83),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.55, 0.148, 4.42),
            red: oklch(0.6, 0.166, 359.85),

            darkGreen: oklch(0.55, 0.14, 143.65),
            green: oklch(0.6, 0.149, 143.66),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: primaries.m20,
            blue: primaries.m10,

            darkMagenta: oklch(0.55, 0.13, 288.9),
            magenta: oklch(0.6, 0.109, 289.93),

            darkCyan: oklch(0.55, 0.131, 154.34),
            cyan: oklch(0.6, 0.155, 153.8),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
