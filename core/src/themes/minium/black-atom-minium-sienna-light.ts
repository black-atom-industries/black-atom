import { defineThemeColors } from "../define-theme-colors.ts";
import { oklch } from "../../utils/color.ts";

import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";
import createFeedback from "./create-feedback-light.ts";

export default defineThemeColors({
    primaries: {
        d10: oklch(0.3, 0.005, 0),
        d20: oklch(0.35, 0.005, 0),
        d30: oklch(0.4, 0.005, 0),
        d40: oklch(0.45, 0.005, 0),

        m10: oklch(0.5, 0.006, 40),
        m20: oklch(0.6, 0.006, 40),
        m30: oklch(0.7, 0.01, 67),
        m40: oklch(0.8, 0.01, 67),

        l10: oklch(0.84, 0.025, 72),
        l20: oklch(0.88, 0.025, 75),
        l30: oklch(0.92, 0.025, 75),
        l40: oklch(0.96, 0.025, 78),
    },
    accents: {
        a10: oklch(0.65, 0.25, 35),
        a20: oklch(0.55, 0.075, 0),
        a30: oklch(0.65, 0.075, 25),
        a40: oklch(0.65, 0.075, 255),
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
            variable: { ...syntax.variable, member: primaries.m10, parameter: primaries.m10 },
            string: { ...syntax.string, default: accents.a40!, doc: primaries.m20 },
            boolean: { default: accents.a40! },
            number: { default: accents.a40! },
            constant: { ...syntax.constant, builtin: accents.a40! },
            type: { default: primaries.d40, builtin: primaries.m10 },
            comment: { ...syntax.comment, default: primaries.m30 },
            tag: { ...syntax.tag, default: accents.a40! },
            keyword: {
                default: accents.a20,
                import: accents.a30 ?? accents.a20,
                export: accents.a30 ?? accents.a20,
            },
        };
    },
});
