import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        // Dark range — deep jungle canopy
        d10: oklch(0.18, 0.06, 160),
        d20: oklch(0.24, 0.07, 155),
        d30: oklch(0.32, 0.08, 150),
        d40: oklch(0.4, 0.09, 145),

        // Mid range — monstera leaf, vibrant fern, bamboo shoot
        m10: oklch(0.4, 0.1, 140),
        m20: oklch(0.5, 0.1, 130),
        m30: oklch(0.6, 0.1, 120),
        m40: oklch(0.7, 0.1, 110),

        // Light range — rice paper, linen, warm sand, aged plaster
        l10: oklch(0.9, 0.03, 95),
        l20: oklch(0.92, 0.03, 85),
        l30: oklch(0.94, 0.03, 75),
        l40: oklch(0.96, 0.03, 65),
    },
    accents: {
        a10: oklch(0.65, 0.125, 60),
        a20: oklch(0.5, 0.15, 130),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.6, 0.085, 10),
            red: oklch(0.6, 0.085, 40),

            darkGreen: accents.a20,
            green: oklch(0.6, 0.15, 120),

            darkYellow: accents.a10,
            yellow: oklch(0.65, 0.125, 100),

            darkBlue: oklch(0.5, 0.085, 150),
            blue: oklch(0.6, 0.085, 150),

            darkMagenta: oklch(0.65, 0.075, 330),
            magenta: oklch(0.65, 0.075, 360),

            darkCyan: oklch(0.5, 0.085, 175),
            cyan: oklch(0.6, 0.085, 170),
        }),
    feedback: ({ palette }) => ({
        ...createFeedback(palette),
        warning: palette.darkYellow,
    }),
    ui: createUi,
    syntax: createSyntax,
});
