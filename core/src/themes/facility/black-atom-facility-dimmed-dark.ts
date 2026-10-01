import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.20, 0.006, 196),
        d20: oklch(0.24, 0.007, 196),
        d30: oklch(0.28, 0.008, 196),
        d40: oklch(0.34, 0.009, 196),

        m10: oklch(0.543, 0.049, 173.68),
        m20: oklch(0.59, 0.062, 162),
        m30: oklch(0.679, 0.059, 166.44),
        m40: oklch(0.76, 0.051, 171.53),

        l10: oklch(0.847, 0.081, 163.39),
        l20: oklch(0.879, 0.073, 163.55),
        l30: oklch(0.913, 0.059, 160.2),
        l40: oklch(0.938, 0.052, 158.88),
    },
    accents: {
        a10: oklch(0.91, 0.142, 117),
        a20: oklch(0.804, 0.115, 76.67),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.72, 0.147, 355.7),
            red: oklch(0.757, 0.129, 355.17),

            darkGreen: oklch(0.71, 0.157, 143.69),
            green: oklch(0.769, 0.126, 144.23),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: primaries.m40,
            blue: primaries.l20,

            darkMagenta: oklch(0.763, 0.071, 271.99),
            magenta: oklch(0.806, 0.049, 274.83),

            darkCyan: oklch(0.728, 0.129, 155.8),
            cyan: oklch(0.802, 0.123, 156.83),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
