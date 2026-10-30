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

        m10: oklch(0.5, 0.006, 35),
        m20: oklch(0.6, 0.006, 35),
        m30: oklch(0.7, 0.01, 35),
        m40: oklch(0.8, 0.01, 35),

        l10: oklch(0.84, 0.015, 65),
        l20: oklch(0.88, 0.015, 65),
        l30: oklch(0.92, 0.015, 65),
        l40: oklch(0.96, 0.015, 65),
    },
    accents: {
        a10: oklch(0.75, 0.2, 45),
        a20: oklch(0.35, 0.035, 45),
        a30: oklch(0.35, 0.035, 65),
        a40: oklch(0.58, 0.12, 250),
    },
    palette: ({ primaries, accents }) =>
        createPalette(primaries, {
            debug: false,
            override: (palette) => ({
                ...palette,
                yellow: accents.a10,
                darkYellow: accents.a20,
                blue: accents.a40!,
                darkBlue: accents.a40!,
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
            comment: { ...syntax.comment, default: primaries.m20 },
            tag: { ...syntax.tag, default: accents.a40! },
            keyword: {
                default: primaries.m10,
                import: accents.a30 ?? accents.a20,
                export: accents.a30 ?? accents.a20,
            },
        };
    },
});
