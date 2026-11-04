import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.202, 0.05, 50),
        d20: oklch(0.301, 0.05, 50),
        d30: oklch(0.348, 0.05, 50),
        d40: oklch(0.438, 0.05, 50),

        m10: oklch(0.483, 0.075, 50),
        m20: oklch(0.569, 0.074, 50),
        m30: oklch(0.655, 0.075, 50),
        m40: oklch(0.742, 0.075, 50),

        l10: oklch(0.85, 0.065, 61),
        l20: oklch(0.9, 0.065, 61),
        l30: oklch(0.925, 0.065, 61),
        l40: oklch(0.96, 0.075, 61),
    },
    accents: {
        a10: oklch(0.615, 0.155, 55),
        a20: oklch(0.615, 0.15, 35),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.55, 0.15, 35),
            red: oklch(0.58, 0.155, 35),

            darkGreen: oklch(0.453, 0.08, 128.52),
            green: oklch(0.499, 0.08, 127.36),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.464, 0.07, 51.31),
            blue: oklch(0.512, 0.08, 49.91),

            darkMagenta: oklch(0.45, 0.075, 315),
            magenta: oklch(0.55, 0.075, 315),

            darkCyan: oklch(0.54, 0.05, 155),
            cyan: oklch(0.58, 0.05, 155),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
