import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch, shade } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.12, 0.012, 250),
        d20: oklch(0.18, 0.012, 250),
        d30: oklch(0.24, 0.012, 250),
        d40: oklch(0.3, 0.012, 250),

        m10: oklch(0.4, 0.012, 250),
        m20: oklch(0.46, 0.012, 250),
        m30: oklch(0.52, 0.012, 250),
        m40: oklch(0.58, 0.012, 250),

        l10: oklch(0.75, 0.012, 250),
        l20: oklch(0.945, 0.012, 250),
        l30: oklch(0.97, 0.012, 250),
        l40: oklch(0.99, 0.012, 250),
    },
    accents: {
        a10: oklch(0.56, 0.17, 155),
        a20: oklch(0.55, 0.19, 145),
        a30: oklch(0.57, 0.19, 265),
        a40: oklch(0.58, 0.22, 365),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            override: (palette) => ({
                ...palette,
                green: accents.a10,
                darkGreen: accents.a20,
                blue: accents.a30!,
                darkBlue: shade(accents.a30!, -0.08),
                magenta: accents.a40!,
                darkMagenta: shade(accents.a40!, -0.08),
            }),
        }),
    feedback: () => createFeedback(),
    ui: createUi,
    syntax: createSyntax,
});
