import type * as Theme from "@black-atom/core";

export type PreviewVar = `--tp-${string}`;

function kebab(key: string): string {
    return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Custom properties for the root of one theme preview: every UI token, each syntax group's
 * default color and all palette slots, under `--tp-*`. `borderColor` replaces the theme's own
 * border color.
 */
export function themeToPreviewProperties(
    theme: Theme.Definition,
    options: { borderColor?: string } = {},
): Record<PreviewVar, string> {
    const { ui, syntax, palette } = theme;
    const syntaxDefaults = Object.entries(syntax).flatMap(([group, colors]) =>
        "default" in colors ? [[`--tp-syn-${kebab(group)}`, colors.default]] : [],
    );
    return {
        ...Object.fromEntries(
            Object.entries(ui.bg).map(([key, color]) => [`--tp-bg-${key}`, color]),
        ),
        ...Object.fromEntries(
            Object.entries(ui.fg).map(([key, color]) => [`--tp-fg-${key}`, color]),
        ),
        "--tp-fg-border": options.borderColor ?? ui.fg.border,
        ...Object.fromEntries(syntaxDefaults),
        "--tp-syn-parameter": syntax.variable.parameter,
        "--tp-syn-attribute": syntax.tag.attribute,
        ...Object.fromEntries(
            Object.entries(palette).map(([slot, color]) => [`--tp-c-${kebab(slot)}`, color]),
        ),
    };
}
