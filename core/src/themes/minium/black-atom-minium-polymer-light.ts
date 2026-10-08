import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "../mnml/create-palette-light.ts";
import createSyntax from "../mnml/create-syntax-light.ts";
import createUi from "../mnml/create-ui-light.ts";
import createFeedback from "../mnml/create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.17, 0.004, 286),
        d20: oklch(0.23, 0.000, 0),
        d30: oklch(0.27, 0.003, 229),
        d40: oklch(0.37, 0.000, 0),

        m10: oklch(0.40, 0.007, 275),
        m20: oklch(0.49, 0.013, 252),
        m30: oklch(0.58, 0.011, 243),
        m40: oklch(0.69, 0.012, 211),

        l10: oklch(0.82, 0.000, 0),
        l20: oklch(0.84, 0.003, 286),
        l30: oklch(0.89, 0.000, 0),
        l40: oklch(0.94, 0.000, 0),
    },
    accents: {
        a10: oklch(0.67, 0.20, 41),
        a20: oklch(0.21, 0.016, 291),
        a30: oklch(0.17, 0.004, 286),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            debug: false,
            override: (palette) => ({
                ...palette,
                yellow: accents.a10,
                darkYellow: accents.a20,
            }),
        }),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: (context) => ({
        ...createSyntax(context),
        keyword: {
            default: context.accents.a20,
            import: context.accents.a30 ?? context.accents.a20,
            export: context.accents.a30 ?? context.accents.a20,
        },
    }),
});
