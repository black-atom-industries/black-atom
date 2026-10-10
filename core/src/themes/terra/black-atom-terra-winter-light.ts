import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        // Dark range - deep cold blues for text
        d10: oklch(0.2, 0.025, 255),
        d20: oklch(0.28, 0.03, 252),
        d30: oklch(0.35, 0.035, 250),
        d40: oklch(0.42, 0.04, 248),

        // Mid range - cold steel blues
        m10: oklch(0.5, 0.045, 248),
        m20: oklch(0.58, 0.05, 250),
        m30: oklch(0.65, 0.045, 252),
        m40: oklch(0.72, 0.04, 255),

        // Light range - icy whites with blue tint for backgrounds
        l10: oklch(0.88, 0.02, 255),
        l20: oklch(0.92, 0.015, 258),
        l30: oklch(0.95, 0.01, 260),
        l40: oklch(0.98, 0.005, 260),
    },
    accents: {
        a10: oklch(0.7661, 0.1674, 65.0),
        a20: oklch(0.6963, 0.1929, 45.0),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            // Cold violet/mauve - red shifted toward blue (lower L for light bg)
            darkRed: oklch(0.48, 0.1, 290),
            red: oklch(0.56, 0.11, 285),

            // Icy teal - green shifted cold
            darkGreen: oklch(0.48, 0.08, 220),
            green: oklch(0.56, 0.09, 215),

            // Warm amber - lamplight in the cold
            darkYellow: accents.a20,
            yellow: accents.a10,

            // Signature blue - slightly more present
            darkBlue: oklch(0.48, 0.11, 255),
            blue: oklch(0.56, 0.12, 250),

            // Cold purple
            darkMagenta: oklch(0.48, 0.09, 300),
            magenta: oklch(0.56, 0.1, 295),

            // Ice cyan - frost accent
            darkCyan: oklch(0.5, 0.1, 210),
            cyan: oklch(0.58, 0.11, 205),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
