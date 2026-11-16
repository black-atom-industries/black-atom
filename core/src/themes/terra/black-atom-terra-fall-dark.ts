import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.2, 0.025, 45),
        d20: oklch(0.22, 0.025, 45),
        d30: oklch(0.26, 0.025, 45),
        d40: oklch(0.3, 0.025, 45),

        m10: oklch(0.5, 0.075, 50.0),
        m20: oklch(0.6, 0.075, 50.0),
        m30: oklch(0.65, 0.05, 50.0),
        m40: oklch(0.7, 0.075, 50.0),

        l10: oklch(0.75, 0.05, 50.0),
        l20: oklch(0.8, 0.05, 50.0),
        l30: oklch(0.85, 0.05, 50.0),
        l40: oklch(0.9, 0.0439, 50.0),
    },
    accents: {
        a10: oklch(0.7, 0.125, 72.07),
        a20: oklch(0.7, 0.125, 50.77),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.64, 0.125, 30),
            red: oklch(0.76, 0.125, 30),

            darkGreen: oklch(0.655, 0.05, 127.63),
            green: oklch(0.698, 0.05, 127.55),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.72, 0.06, 50),
            blue: oklch(0.82, 0.055, 50),

            darkMagenta: oklch(0.6, 0.05, 315),
            magenta: oklch(0.66, 0.05, 315),

            darkCyan: oklch(0.72, 0.04, 155),
            cyan: oklch(0.78, 0.04, 155),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
