import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.23, 0.000, 0),
        d20: oklch(0.27, 0.003, 229),
        d30: oklch(0.28, 0.003, 229),
        d40: oklch(0.37, 0.000, 0),

        m10: oklch(0.40, 0.007, 275),
        m20: oklch(0.49, 0.013, 252),
        m30: oklch(0.58, 0.011, 243),
        m40: oklch(0.69, 0.012, 211),

        l10: oklch(0.76, 0.000, 0),
        l20: oklch(0.79, 0.003, 106),
        l30: oklch(0.85, 0.004, 68),
        l40: oklch(0.94, 0.000, 0),
    },
    accents: {
        a10: oklch(0.75, 0.17, 41),
        a20: oklch(0.90, 0.021, 228),
        a30: oklch(0.94, 0.000, 0),
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
