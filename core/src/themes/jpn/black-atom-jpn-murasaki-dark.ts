import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.2, 0.042, 0),
        d20: oklch(0.26, 0.042, 0.0),
        d30: oklch(0.32, 0.042, 0),
        d40: oklch(0.4, 0.042, 0),

        m10: oklch(0.453, 0.072, 330.42),
        m20: oklch(0.498, 0.081, 330.78),
        m30: oklch(0.541, 0.078, 324.95),
        m40: oklch(0.581, 0.084, 325.1),

        l10: oklch(0.714, 0.061, 325.27),
        l20: oklch(0.789, 0.045, 323.6),
        l30: oklch(0.829, 0.039, 323.23),
        l40: oklch(0.906, 0.023, 323.62),
    },
    accents: {
        a10: oklch(0.75, 0.135, 78.01),
        a20: oklch(0.75, 0.135, 64.87),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.7, 0.15, 28.4),
            red: oklch(0.75, 0.15, 25.7),

            darkGreen: oklch(0.7, 0.075, 163.39),
            green: oklch(0.75, 0.075, 165.36),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.7, 0.05, 226.16),
            blue: oklch(0.75, 0.05, 222.11),

            darkMagenta: oklch(0.75, 0.075, 305.64),
            magenta: oklch(0.75, 0.075, 352.46),

            darkCyan: oklch(0.7, 0.075, 194.47),
            cyan: oklch(0.75, 0.075, 194.49),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
