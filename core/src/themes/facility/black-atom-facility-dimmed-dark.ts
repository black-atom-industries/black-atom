import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.2, 0.006, 232),
        d20: oklch(0.24, 0.007, 232),
        d30: oklch(0.28, 0.008, 232),
        d40: oklch(0.34, 0.009, 232),

        m10: oklch(0.543, 0.012, 205),
        m20: oklch(0.59, 0.014, 205),
        m30: oklch(0.679, 0.015, 205),
        m40: oklch(0.76, 0.015, 205),

        l10: oklch(0.847, 0.012, 215),
        l20: oklch(0.879, 0.012, 215),
        l30: oklch(0.913, 0.012, 215),
        l40: oklch(0.938, 0.012, 215),
    },
    accents: {
        a10: oklch(0.935, 0.18, 119),
        a20: oklch(0.85, 0.135, 82.83),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.8, 0.147, 355.7),
            red: oklch(0.85, 0.129, 355.17),

            darkGreen: oklch(0.8, 0.15, 145.15),
            green: oklch(0.85, 0.131, 144.83),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: primaries.m40,
            blue: primaries.l20,

            darkMagenta: oklch(0.8, 0.088, 279.85),
            magenta: oklch(0.85, 0.086, 280.82),

            darkCyan: oklch(0.8, 0.116, 156.61),
            cyan: oklch(0.85, 0.109, 157.69),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
