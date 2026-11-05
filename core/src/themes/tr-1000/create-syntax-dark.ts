import type * as Theme from "../../types/theme.ts";

export default function ({ primaries, palette, feedback }: Theme.CreatorContext): Theme.Syntax {
    return {
        variable: {
            default: palette.blue,
            builtin: palette.blue,
            member: palette.darkBlue,
            parameter: palette.darkBlue,
        },
        property: {
            default: palette.darkBlue,
        },
        string: {
            default: palette.green,
            doc: palette.green,
            regexp: palette.red,
            escape: palette.red,
        },
        constant: {
            default: primaries.l20,
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
            default: palette.lightGray,
            delimiter: primaries.m40,
            bracket: palette.lightGray,
            special: palette.lightGray,
        },
        comment: {
            default: palette.gray,
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
                h4: palette.lightGray,
                h5: palette.lightGray,
                h6: palette.lightGray,
            },
            list: {
                default: palette.lightGray,
                checked: palette.green,
                unchecked: palette.lightGray,
            },
            strong: palette.darkCyan,
            italic: palette.darkCyan,
            strikethrough: palette.darkCyan,
            quote: palette.green,
            math: palette.darkGreen,
            link: palette.green,
            code: {
                fg: primaries.m40,
                bg: primaries.d40,
            },
        },
        tag: {
            default: palette.darkCyan,
            builtin: palette.darkYellow,
            attribute: primaries.m40,
            delimiter: primaries.l10,
        },
    };
}
