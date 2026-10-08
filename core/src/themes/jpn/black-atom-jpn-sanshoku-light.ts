import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.216, 0.018, 237.84),
        d20: oklch(0.238, 0.033, 239.41),
        d30: oklch(0.28, 0.026, 235.29),
        d40: oklch(0.36, 0.031, 234.14),

        m10: oklch(0.468, 0.026, 233.93),
        m20: oklch(0.51, 0.029, 237.33),
        m30: oklch(0.554, 0.032, 235.33),
        m40: oklch(0.643, 0.031, 231.75),

        l10: oklch(0.775, 0.021, 224.38),
        l20: oklch(0.807, 0.019, 223.65),
        l30: oklch(0.847, 0.015, 224.53),
        l40: oklch(0.886, 0.011, 226),
    },
    accents: {
        a10: "#cc8f00",
        a20: "#457ea1",
        a30: oklch(0.62, 0.175, 30),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            darkRed: oklch(0.52, 0.175, 30),
            red: accents.a30!,

            darkGreen: oklch(0.52, 0.130, 150),
            green: oklch(0.62, 0.130, 150),

            darkYellow: oklch(0.58, 0.140, 72),
            yellow: accents.a10,

            darkBlue: oklch(0.47, 0.080, 240),
            blue: accents.a20,

            darkMagenta: oklch(0.52, 0.150, 350),
            magenta: oklch(0.62, 0.150, 350),

            darkCyan: oklch(0.52, 0.100, 200),
            cyan: oklch(0.62, 0.100, 200),
        }),
    feedback: ({ palette }) => createFeedback(palette),
    ui: createUi,
    syntax: createSyntax,
});
