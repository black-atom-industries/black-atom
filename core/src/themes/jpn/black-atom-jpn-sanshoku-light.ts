import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.25, 0.045, 250),
        d20: oklch(0.3, 0.05, 250),
        d30: oklch(0.4, 0.05, 250),
        d40: oklch(0.45, 0.04, 250),

        m10: oklch(0.5, 0.04, 250),
        m20: oklch(0.6, 0.035, 250),
        m30: oklch(0.61, 0.03, 250),
        m40: oklch(0.78, 0.025, 250),

        l10: oklch(0.9, 0.02, 250),
        l20: oklch(0.93, 0.015, 250),
        l30: oklch(0.955, 0.012, 250),
        l40: oklch(0.975, 0.008, 250),
    },
    accents: {
        a10: oklch(0.635, 0.16, 72),
        a20: oklch(0.538, 0.14, 255),
        a30: oklch(0.558, 0.19, 30),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.42, 0.17, 30),
            red: accents.a30!,

            darkGreen: oklch(0.45, 0.12, 150),
            green: oklch(0.52, 0.13, 150),

            darkYellow: oklch(0.58, 0.16, 62),
            yellow: accents.a10,

            darkBlue: oklch(0.44, 0.1, 250),
            blue: accents.a20,

            darkMagenta: oklch(0.5, 0.15, 350),
            magenta: oklch(0.645, 0.15, 350),

            darkCyan: oklch(0.5, 0.1, 200),
            cyan: oklch(0.615, 0.1, 200),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
