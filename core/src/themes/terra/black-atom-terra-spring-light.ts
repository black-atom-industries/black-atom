import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.26, 0.035, 120),
        d20: oklch(0.41, 0.04, 120),
        d30: oklch(0.47, 0.045, 120),
        d40: oklch(0.52, 0.05, 120),

        m10: oklch(0.51, 0.045, 120),
        m20: oklch(0.62, 0.07, 337),
        m30: oklch(0.8, 0.05, 337),
        m40: oklch(0.86, 0.04, 337),

        l10: oklch(0.9, 0.035, 80),
        l20: oklch(0.93, 0.03, 80),
        l30: oklch(0.96, 0.022, 80),
        l40: oklch(0.985, 0.012, 80),
    },
    accents: {
        a10: oklch(0.68, 0.15, 26),
        a20: oklch(0.72, 0.14, 85),
    },
    palette: ({ primaries }) =>
        createPalette(primaries, {
            darkRed: oklch(0.479, 0.13, 10),
            red: oklch(0.526, 0.15, 26),

            darkGreen: oklch(0.463, 0.13, 135),
            green: oklch(0.508, 0.13, 130),

            darkYellow: oklch(0.648, 0.11, 78),
            yellow: oklch(0.641, 0.13, 85),

            darkBlue: oklch(0.465, 0.11, 265),
            blue: oklch(0.513, 0.105, 265),

            darkMagenta: oklch(0.614, 0.1, 330),
            magenta: oklch(0.646, 0.1, 330),

            darkCyan: oklch(0.589, 0.08, 165),
            cyan: oklch(0.624, 0.08, 165),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
