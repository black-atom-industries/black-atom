import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.14, 0, 0),
        d20: oklch(0.2, 0, 0),
        d30: oklch(0.26, 0, 0),
        d40: oklch(0.3, 0, 0),

        m10: oklch(0.48, 0, 0),
        m20: oklch(0.58, 0, 0),
        m30: oklch(0.64, 0, 0),
        m40: oklch(0.72, 0, 0),

        l10: oklch(0.82, 0, 0),
        l20: oklch(0.86, 0, 0),
        l30: oklch(0.9, 0, 0),
        l40: oklch(0.94, 0, 0),
    },
    accents: {
        a10: oklch(0.8, 0.035, 0),
        a20: oklch(0.75, 0.025, 0),
    },
    palette: ({ primaries }) => createPalette(primaries),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
