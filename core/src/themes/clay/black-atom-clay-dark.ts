import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.25, 0.01, 90),
        d20: oklch(0.3, 0.01, 90),
        d30: oklch(0.35, 0.01, 90),
        d40: oklch(0.4, 0.01, 90),

        m10: oklch(0.55, 0.025, 90),
        m20: oklch(0.6, 0.025, 90),
        m30: oklch(0.7, 0.025, 90),
        m40: oklch(0.75, 0.025, 90),

        l10: oklch(0.8, 0.025, 95),
        l20: oklch(0.85, 0.025, 95),
        l30: oklch(0.9, 0.025, 95),
        l40: oklch(0.95, 0.025, 95),
    },
    accents: {
        a10: oklch(0.75, 0.15, 40),
        a20: oklch(0.75, 0.05, 95),
    },
    palette: ({ primaries }) => createPalette(primaries),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
