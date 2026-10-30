import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        // Ink: deep leaf green, the text color of new growth
        d10: oklch(0.26, 0.06, 160),
        d20: oklch(0.41, 0.07, 155),
        d30: oklch(0.47, 0.07, 155),
        d40: oklch(0.52, 0.07, 155),

        // Mid: stem and moss, subtle text and comments
        m10: oklch(0.51, 0.09, 150),
        m20: oklch(0.62, 0.08, 150),
        m30: oklch(0.8, 0.06, 150),
        m40: oklch(0.86, 0.05, 150),

        // Surfaces: pale spring air, a green-white that warms toward cream
        l10: oklch(0.9, 0.035, 135),
        l20: oklch(0.93, 0.03, 130),
        l30: oklch(0.96, 0.025, 125),
        l40: oklch(0.985, 0.015, 120),
    },
    accents: {
        // Sprout yellow-green, cursor and badges
        a10: oklch(0.86, 0.19, 115),
        // Apricot, the warm tone of spring blossom
        a20: oklch(0.648, 0.18, 70),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            // Cherry blossom
            darkRed: oklch(0.513, 0.15, 15),
            red: oklch(0.56, 0.15, 15),

            // New leaf
            darkGreen: oklch(0.481, 0.16, 150),
            green: oklch(0.526, 0.16, 150),

            // Daffodil, apricot
            darkYellow: accents.a20,
            yellow: oklch(0.641, 0.17, 95),

            // Spring sky
            darkBlue: oklch(0.491, 0.1, 245),
            blue: oklch(0.539, 0.1, 245),

            // Lilac
            darkMagenta: oklch(0.614, 0.1, 315),
            magenta: oklch(0.646, 0.1, 310),

            // Pond water
            darkCyan: oklch(0.589, 0.1, 192),
            cyan: oklch(0.624, 0.1, 190),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
