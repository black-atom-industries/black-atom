import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        // Ground: a green-black garden at night
        d10: oklch(0.18, 0.025, 160),
        d20: oklch(0.23, 0.028, 158),
        d30: oklch(0.28, 0.03, 158),
        d40: oklch(0.34, 0.032, 158),

        // Mid: moss and stem
        m10: oklch(0.4, 0.06, 152),
        m20: oklch(0.5, 0.07, 152),
        m30: oklch(0.61, 0.07, 150),
        m40: oklch(0.72, 0.06, 150),

        // Ink: pale new-leaf text
        l10: oklch(0.74, 0.05, 130),
        l20: oklch(0.8, 0.045, 130),
        l30: oklch(0.86, 0.04, 130),
        l40: oklch(0.92, 0.03, 125),
    },
    accents: {
        // Sapling, cursor and badges
        a10: oklch(0.84, 0.11, 140),
        // Apricot blossom
        a20: oklch(0.78, 0.1, 65),
    },
    palette: ({ primaries }) =>
        createPalette(primaries, {
            // Cherry blossom
            darkRed: oklch(0.72, 0.085, 10),
            red: oklch(0.79, 0.08, 10),

            // New leaf
            darkGreen: oklch(0.72, 0.085, 145),
            green: oklch(0.8, 0.085, 140),

            // Primrose, apricot
            darkYellow: oklch(0.78, 0.1, 65),
            yellow: oklch(0.86, 0.1, 100),

            // Spring sky
            darkBlue: oklch(0.72, 0.07, 240),
            blue: oklch(0.8, 0.065, 240),

            // Lilac
            darkMagenta: oklch(0.72, 0.075, 310),
            magenta: oklch(0.79, 0.07, 310),

            // Pond water
            darkCyan: oklch(0.72, 0.065, 190),
            cyan: oklch(0.8, 0.06, 190),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
