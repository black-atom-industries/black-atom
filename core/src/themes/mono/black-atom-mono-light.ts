import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.14, 0.005, 67.5),
        d20: oklch(0.2, 0.005, 67.5),
        d30: oklch(0.28, 0.005, 67.5),
        d40: oklch(0.36, 0.005, 67.5),

        m10: oklch(0.64, 0.005, 67.5),
        m20: oklch(0.7, 0.005, 67.5),
        m30: oklch(0.76, 0.005, 67.5),
        m40: oklch(0.82, 0.005, 67.5),

        l10: oklch(0.9, 0.005, 67.5),
        l20: oklch(0.95, 0.005, 67.5),
        l30: oklch(0.99, 0.005, 67.5),
        l40: oklch(1.0, 0.005, 67.5),
    },
    accents: {
        a10: oklch(0.3, 0, 0),
        a20: oklch(0.42, 0, 0),
    },
    palette: ({ primaries }) => createPalette(primaries),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
