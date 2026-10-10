import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.251, 0.015, 261.66),
        d20: oklch(0.335, 0.025, 162.99),
        d30: oklch(0.394, 0.028, 164.41),
        d40: oklch(0.443, 0.03, 177.07),

        m10: oklch(0.543, 0.049, 173.68),
        m20: oklch(0.59, 0.062, 162),
        m30: oklch(0.679, 0.059, 166.44),
        m40: oklch(0.753, 0.042, 172.29),

        l10: oklch(0.927, 0.006, 196),
        l20: oklch(0.955, 0.005, 196),
        l30: oklch(0.981, 0.001, 196),
        l40: oklch(1, 0, 0),
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
