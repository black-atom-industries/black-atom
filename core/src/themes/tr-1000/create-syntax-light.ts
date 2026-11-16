import type * as Theme from "../../types/theme.ts";

export default function ({ primaries, palette, feedback }: Theme.CreatorContext): Theme.Syntax {
    return {
        variable: {
            default: primaries.m10,
            builtin: primaries.d30,
            member: primaries.m10,
            parameter: palette.darkBlue,
        },
        property: {
            default: primaries.m10,
        },
        string: {
            default: palette.green,
            doc: palette.green,
            regexp: palette.red,
            escape: palette.red,
        },
        constant: {
            default: palette.gray,
            builtin: palette.darkRed,
        },
        module: {
            default: palette.darkBlue,
        },
        boolean: {
            default: palette.magenta,
        },
        number: {
            default: palette.magenta,
        },
        type: {
            default: palette.magenta,
            builtin: palette.magenta,
        },
        attribute: {
            default: palette.darkYellow,
            builtin: palette.darkYellow,
        },
        func: {
            default: palette.darkCyan,
            builtin: palette.darkCyan,
            method: palette.darkCyan,
        },
        constructor: {
            default: palette.darkCyan,
        },
        keyword: {
            default: palette.red,
            import: palette.red,
            export: palette.red,
        },
        operator: {
            default: palette.magenta,
        },
        punctuation: {
            default: palette.gray,
            delimiter: primaries.m40,
            bracket: palette.gray,
            special: palette.gray,
        },
        comment: {
            default: primaries.m30,
            doc: palette.darkGreen,
            todo: feedback.success,
            error: feedback.negative,
            warn: feedback.warning,
            info: feedback.info,
            hint: palette.darkYellow,
        },
        markup: {
            heading: {
                h1: palette.darkCyan,
                h2: palette.darkCyan,
                h3: palette.darkCyan,
                h4: palette.gray,
                h5: palette.gray,
                h6: palette.gray,
            },
            list: {
                default: palette.gray,
                checked: palette.green,
                unchecked: palette.gray,
            },
            strong: palette.darkCyan,
            italic: palette.darkCyan,
            strikethrough: palette.darkCyan,
            quote: palette.green,
            math: palette.darkGreen,
            link: palette.green,
            code: {
                fg: primaries.m10,
                bg: primaries.l10,
            },
        },
        tag: {
            default: palette.darkCyan,
            builtin: palette.darkYellow,
            attribute: primaries.m10,
            delimiter: palette.darkGreen,
        },
    };
}
