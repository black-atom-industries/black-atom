import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch, shade } from "../../utils/color.ts";

import createFeedback from "./create-feedback-dark.ts";
import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.16, 0.012, 250),
        d20: oklch(0.2, 0.012, 250),
        d30: oklch(0.24, 0.012, 250),
        d40: oklch(0.28, 0.012, 250),

        m10: oklch(0.48, 0.012, 250),
        m20: oklch(0.54, 0.012, 250),
        m30: oklch(0.6, 0.012, 250),
        m40: oklch(0.66, 0.012, 250),

        l10: oklch(0.88, 0.012, 250),
        l20: oklch(0.91, 0.012, 250),
        l30: oklch(0.94, 0.012, 250),
        l40: oklch(0.97, 0.012, 250),
    },
    accents: {
        a10: oklch(0.75, 0.15, 155),
        a20: oklch(0.7, 0.15, 145),
        a30: oklch(0.75, 0.15, 265),
        a40: oklch(0.75, 0.15, 365),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            override: (palette) => ({
                ...palette,
                green: accents.a10,
                darkGreen: accents.a20,
                blue: accents.a30!,
                darkBlue: shade(accents.a30!, -0.1),
                magenta: accents.a40!,
                darkMagenta: shade(accents.a40!, -0.1),
            }),
        }),
    feedback: () => createFeedback(),
    ui: createUi,
    syntax: createSyntax,
});
