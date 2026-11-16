import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.271, 0.005, 232),
        d20: oklch(0.26, 0.005, 232),
        d30: oklch(0.394, 0.006, 232),
        d40: oklch(0.438, 0.007, 232),

        m10: oklch(0.43, 0.014, 205),
        m20: oklch(0.48, 0.016, 205),
        m30: oklch(0.46, 0.02, 205),
        m40: oklch(0.681, 0.015, 205),

        l10: oklch(0.88, 0.011, 215),
        l20: oklch(0.93, 0.012, 215),
        l30: oklch(0.95, 0.009, 215),
        l40: oklch(0.985, 0.009, 215),
    },
    accents: {
        a10: oklch(0.8, 0.186, 119),
        a20: oklch(0.6, 0.125, 82.83),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.5, 0.17, 4.42),
            red: oklch(0.54, 0.18, 359.85),

            darkGreen: oklch(0.46, 0.15, 143.65),
            green: oklch(0.5, 0.16, 143.66),

            darkYellow: accents.a20,
            yellow: oklch(0.6, 0.145, 119),

            darkBlue: primaries.m20,
            blue: primaries.m10,

            darkMagenta: oklch(0.48, 0.15, 288.9),
            magenta: oklch(0.52, 0.14, 289.93),

            darkCyan: oklch(0.47, 0.14, 154.34),
            cyan: oklch(0.52, 0.16, 153.8),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
