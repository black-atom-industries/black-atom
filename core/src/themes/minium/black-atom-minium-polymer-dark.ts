import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-dark.ts";
import createSyntax from "./create-syntax-dark.ts";
import createUi from "./create-ui-dark.ts";
import createFeedback from "./create-feedback-dark.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.25, 0.004, 35),
        d20: oklch(0.28, 0.004, 35),
        d30: oklch(0.33, 0.005, 35),
        d40: oklch(0.39, 0.005, 35),

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
        a10: oklch(0.75, 0.16, 35),
        a20: oklch(0.94, 0.016, 80),
        a30: oklch(0.94, 0.0, 0),
        a40: oklch(0.72, 0.08, 255),
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
    syntax: (context) => {
        const syntax = createSyntax(context);
        const { primaries, accents } = context;
        return {
            ...syntax,
            variable: { ...syntax.variable, member: primaries.l10, parameter: primaries.l10 },
            string: { ...syntax.string, default: accents.a40! },
            boolean: { default: accents.a40! },
            number: { default: accents.a40! },
            constant: { ...syntax.constant, builtin: accents.a40! },
            type: { default: primaries.l30, builtin: primaries.l10 },
            tag: { ...syntax.tag, default: accents.a40! },
            keyword: {
                default: accents.a10,
                import: accents.a30 ?? accents.a20,
                export: accents.a30 ?? accents.a20,
            },
        };
    },
});
