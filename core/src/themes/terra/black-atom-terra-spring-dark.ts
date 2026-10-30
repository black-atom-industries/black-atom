import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        // Ground: a green-black garden at night
        d10: oklch(0.18, 0.035, 160),
        d20: oklch(0.23, 0.04, 158),
        d30: oklch(0.28, 0.045, 158),
        d40: oklch(0.34, 0.045, 158),

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
        // Sprout, cursor and badges
        a10: oklch(0.88, 0.18, 115),
        // Apricot blossom
        a20: oklch(0.74, 0.16, 70),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            // Cherry blossom
            darkRed: oklch(0.707, 0.13, 15),
            red: oklch(0.749, 0.13, 15),

            // New leaf
            darkGreen: oklch(0.677, 0.13, 150),
            green: oklch(0.718, 0.13, 150),

            // Daffodil, apricot
            darkYellow: accents.a20,
            yellow: oklch(0.731, 0.16, 95),

            // Spring sky
            darkBlue: oklch(0.689, 0.1, 245),
            blue: oklch(0.731, 0.1, 245),

            // Lilac
            darkMagenta: oklch(0.701, 0.11, 315),
            magenta: oklch(0.744, 0.11, 310),

            // Pond water
            darkCyan: oklch(0.679, 0.1, 192),
            cyan: oklch(0.72, 0.1, 190),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
