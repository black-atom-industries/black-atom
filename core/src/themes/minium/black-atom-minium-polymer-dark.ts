import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.23, 0.016, 250),
        d20: oklch(0.26, 0.018, 250),
        d30: oklch(0.31, 0.02, 250),
        d40: oklch(0.37, 0.022, 250),

        m10: oklch(0.4, 0.006, 40),
        m20: oklch(0.49, 0.006, 40),
        m30: oklch(0.58, 0.01, 67),
        m40: oklch(0.69, 0.01, 67),

        l10: oklch(0.76, 0.02, 72),
        l20: oklch(0.79, 0.024, 75),
        l30: oklch(0.85, 0.028, 75),
        l40: oklch(0.94, 0.03, 78),
    },
    accents: {
        a10: oklch(0.7508, 0.1685, 52.2),
        a20: oklch(0.94, 0.016, 80),
        a30: oklch(0.94, 0.0, 0),
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
            default: context.accents.a10,
            import: context.accents.a30 ?? context.accents.a20,
            export: context.accents.a30 ?? context.accents.a20,
        },
    }),
});
