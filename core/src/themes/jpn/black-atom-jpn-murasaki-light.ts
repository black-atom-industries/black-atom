import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.26, 0.042, 0),
        d20: oklch(0.32, 0.042, 0),
        d30: oklch(0.38, 0.042, 0),
        d40: oklch(0.45, 0.042, 0),

        m10: oklch(0.453, 0.072, 330.42),
        m20: oklch(0.498, 0.081, 330.78),
        m30: oklch(0.541, 0.078, 324.95),
        m40: oklch(0.714, 0.061, 325.27),

        l10: oklch(0.86, 0.039, 323.23),
        l20: oklch(0.91, 0.03, 323.6),
        l30: oklch(0.945, 0.02, 323.62),
        l40: oklch(0.965, 0.015, 323.62),
    },
    accents: {
        a10: oklch(0.7, 0.13, 118),
        a20: oklch(0.62, 0.11, 113),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.55, 0.17, 28.4),
            red: oklch(0.62, 0.17, 25.7),

            darkGreen: oklch(0.55, 0.11, 163.39),
            green: oklch(0.62, 0.11, 165.36),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.55, 0.08, 226.16),
            blue: oklch(0.62, 0.08, 222.11),

            darkMagenta: oklch(0.6, 0.11, 305.64),
            magenta: oklch(0.62, 0.11, 352.46),

            darkCyan: oklch(0.55, 0.11, 194.47),
            cyan: oklch(0.62, 0.11, 194.49),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
