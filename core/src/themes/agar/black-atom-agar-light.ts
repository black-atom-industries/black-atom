import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.225, 0.02, 100),
        d20: oklch(0.275, 0.023, 100),
        d30: oklch(0.35, 0.02, 100),
        d40: oklch(0.4, 0.02, 100),

        m10: oklch(0.45, 0.02, 100),
        m20: oklch(0.55, 0.02, 100),
        m30: oklch(0.65, 0.02, 100),
        m40: oklch(0.75, 0.02, 100),

        l10: oklch(0.825, 0.02, 100),
        l20: oklch(0.875, 0.02, 100),
        l30: oklch(0.925, 0.02, 100),
        l40: oklch(0.975, 0.02, 100),
    },
    accents: {
        a10: oklch(0.65, 0.2, 145),
        a20: oklch(0.65, 0.2, 135),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.45, 0.2, 5),
            red: oklch(0.55, 0.2, 365),

            darkGreen: oklch(0.45, 0.15, 145),
            green: oklch(0.55, 0.16, 145),

            darkYellow: accents.a20,
            yellow: accents.a10,

            darkBlue: oklch(0.45, 0.2, 273),
            blue: oklch(0.55, 0.2, 273),

            darkMagenta: oklch(0.55, 0.2, 0),
            magenta: oklch(0.65, 0.2, 0.0),

            darkCyan: oklch(0.45, 0.2, 155),
            cyan: oklch(0.55, 0.2, 155),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
