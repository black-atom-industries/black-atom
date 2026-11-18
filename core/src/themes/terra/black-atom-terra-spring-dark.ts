import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.18, 0.018, 120),
        d20: oklch(0.23, 0.02, 120),
        d30: oklch(0.28, 0.022, 120),
        d40: oklch(0.34, 0.025, 120),

        m10: oklch(0.4, 0.025, 120),
        m20: oklch(0.5, 0.06, 337),
        m30: oklch(0.65, 0.07, 337),
        m40: oklch(0.72, 0.06, 337),

        l10: oklch(0.74, 0.035, 80),
        l20: oklch(0.8, 0.035, 80),
        l30: oklch(0.86, 0.03, 80),
        l40: oklch(0.92, 0.025, 80),
    },
    accents: {
        a10: oklch(0.78, 0.12, 26),
        a20: oklch(0.86, 0.14, 85),
    },
    palette: ({ primaries }) =>
        createPalette(primaries, {
            darkRed: oklch(0.72, 0.1, 10),
            red: oklch(0.78, 0.12, 26),

            darkGreen: oklch(0.72, 0.1, 135),
            green: oklch(0.8, 0.1, 130),

            darkYellow: oklch(0.75, 0.08, 78),
            yellow: oklch(0.86, 0.13, 85),

            darkBlue: oklch(0.72, 0.08, 265),
            blue: oklch(0.8, 0.075, 265),

            darkMagenta: oklch(0.72, 0.07, 330),
            magenta: oklch(0.79, 0.07, 330),

            darkCyan: oklch(0.72, 0.065, 165),
            cyan: oklch(0.8, 0.06, 165),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
