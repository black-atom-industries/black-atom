import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.25, 0.02, 90),
        d20: oklch(0.3, 0.02, 90),
        d30: oklch(0.35, 0.02, 90),
        d40: oklch(0.4, 0.02, 90),

        m10: oklch(0.45, 0.035, 90),
        m20: oklch(0.5, 0.035, 90),
        m30: oklch(0.55, 0.035, 90),
        m40: oklch(0.6, 0.035, 90),

        l10: oklch(0.88, 0.03, 95),
        l20: oklch(0.92, 0.03, 95),
        l30: oklch(0.96, 0.03, 95),
        l40: oklch(0.98, 0.03, 95),
    },
    accents: {
        a10: oklch(0.67, 0.165, 40),
        a20: oklch(0.55, 0.05, 95),
    },
    palette: ({ primaries }) => createPalette(primaries),
    feedback: ({ accents }) => createFeedback(accents),
    ui: createUi,
    syntax: createSyntax,
});
