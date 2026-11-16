import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch, shade } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.3, 0.045, 183),
        d20: oklch(0.34, 0.05, 183),
        d30: oklch(0.38, 0.055, 183),
        d40: oklch(0.407, 0.073, 183),

        m10: oklch(0.5, 0.09, 183),
        m20: oklch(0.58, 0.09, 183),
        m30: oklch(0.72, 0.08, 183),
        m40: oklch(0.8, 0.08, 183),

        l10: oklch(0.84, 0.045, 183),
        l20: oklch(0.88, 0.035, 183),
        l30: oklch(0.94, 0.025, 183),
        l40: oklch(0.98, 0.0125, 183),
    },
    accents: {
        a10: oklch(0.65, 0.2, 40),
        a20: oklch(0.58, 0.2, 150),
        a30: oklch(0.65, 0.2, 70),
        a40: oklch(0.57, 0.2, 183),
    },
    palette: ({ primaries, accents }) => {
        const blue = oklch(0.58, 0.1, 250);
        const magenta = oklch(0.58, 0.08, 365);

        return createPalette(primaries, {
            debug: false,
            override: (palette) => ({
                ...palette,
                red: accents.a10,
                darkRed: shade(accents.a10, -0.08),
                green: accents.a20,
                darkGreen: shade(accents.a20, -0.08),
                yellow: accents.a30!,
                darkYellow: shade(accents.a30!, -0.08),
                cyan: accents.a40!,
                darkCyan: shade(accents.a40!, -0.08),
                blue,
                darkBlue: shade(blue, -0.08),
                magenta,
                darkMagenta: shade(magenta, -0.08),
            }),
        });
    },
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
