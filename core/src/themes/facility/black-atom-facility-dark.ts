import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.12, 0.005, 196),
        d20: oklch(0.17, 0.006, 196),
        d30: oklch(0.23, 0.007, 196),
        d40: oklch(0.29, 0.008, 196),

        m10: oklch(0.543, 0.049, 173.68),
        m20: oklch(0.59, 0.062, 162),
        m30: oklch(0.679, 0.059, 166.44),
        m40: oklch(0.76, 0.051, 171.53),

        l10: oklch(0.88, 0.062, 164.62),
        l20: oklch(0.913, 0.053, 164.11),
        l30: oklch(0.94, 0.04, 161.61),
        l40: oklch(0.971, 0.025, 160.61),
    },
    accents: {
        a10: oklch(0.935, 0.155, 117),
        a20: oklch(0.803, 0.135, 82.83),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.72, 0.147, 355.7),
            red: oklch(0.757, 0.129, 355.17),

            darkGreen: oklch(0.731, 0.15, 145.15),
            green: oklch(0.778, 0.131, 144.83),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: primaries.m40,
            blue: primaries.l20,

            darkMagenta: oklch(0.72, 0.088, 279.85),
            magenta: oklch(0.754, 0.086, 280.82),

            darkCyan: oklch(0.728, 0.116, 156.61),
            cyan: oklch(0.808, 0.109, 157.69),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
