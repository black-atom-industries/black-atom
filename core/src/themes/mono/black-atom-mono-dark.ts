import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.12, 0.005, 67.5),
        d20: oklch(0.16, 0.005, 67.5),
        d30: oklch(0.22, 0.005, 67.5),
        d40: oklch(0.28, 0.005, 67.5),

        m10: oklch(0.4, 0.005, 67.5),
        m20: oklch(0.5, 0.005, 67.5),
        m30: oklch(0.6, 0.005, 67.5),
        m40: oklch(0.7, 0.005, 67.5),

        l10: oklch(0.82, 0.005, 67.5),
        l20: oklch(0.88, 0.005, 67.5),
        l30: oklch(0.94, 0.005, 67.5),
        l40: oklch(0.98, 0.005, 67.5),
    },
    accents: {
        a10: oklch(0.92, 0, 0),
        a20: oklch(0.78, 0, 0),
    },
    palette: ({ primaries }) => createPalette(primaries),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
