import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.271, 0.017, 259.78),
        d20: oklch(0.335, 0.025, 162.99),
        d30: oklch(0.394, 0.028, 164.41),
        d40: oklch(0.443, 0.03, 177.07),

        m10: oklch(0.494, 0.044, 172.8),
        m20: oklch(0.543, 0.057, 161.43),
        m30: oklch(0.643, 0.065, 166.03),
        m40: oklch(0.681, 0.054, 170.67),

        l10: oklch(0.88, 0.008, 196),
        l20: oklch(0.915, 0.007, 196),
        l30: oklch(0.95, 0.006, 196),
        l40: oklch(0.985, 0.005, 196),
    },
    accents: {
        a10: oklch(0.75, 0.155, 117),
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
