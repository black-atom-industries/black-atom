import type { ThemeDefinition } from "@black-atom/core";

/**
 * Maps a theme's UI palette onto the --ba-* chrome tokens, so the whole
 * chrome re-tints with the selected theme (components consume tokens,
 * never hex — see docs/design-system/reference/readme.md).
 *
 * Role mapping:
 *
 * | token                  | theme source   | role                                |
 * | ---------------------- | -------------- | ----------------------------------- |
 * | --ba-color-bg-recessed | ui.bg.float    | inputs, code previews (inset tier)  |
 * | --ba-color-bg-default  | ui.bg.default  | page                                |
 * | --ba-color-bg-subtle   | ui.bg.panel    | bars, panels, hover tier            |
 * | --ba-color-bg-hint     | ui.bg.active   | selection surface                   |
 * | --ba-color-bg-contrast | ui.bg.contrast | primary actuator, active chip       |
 * | --ba-color-fg-*        | ui.fg.*        | text tiers + intent colors          |
 *
 * Borders (--ba-color-border-*) and focus (--ba-color-focus) are NOT
 * emitted: the static token layer derives them from fg-default and
 * fg-positive via color-mix, so they re-tint automatically.
 */
export function themeToCustomProperties(theme: ThemeDefinition): Record<string, string> {
    return {
        // Backgrounds — tonal tiers: recessed < default < subtle < hint
        "--ba-color-bg-recessed": theme.ui.bg.float,
        "--ba-color-bg-default": theme.ui.bg.default,
        "--ba-color-bg-subtle": theme.ui.bg.panel,
        "--ba-color-bg-hint": theme.ui.bg.active,
        "--ba-color-bg-contrast": theme.ui.bg.contrast,
        "--ba-color-bg-disabled": theme.ui.bg.disabled,

        // Foregrounds
        "--ba-color-fg-default": theme.ui.fg.default,
        "--ba-color-fg-subtle": theme.ui.fg.subtle,
        "--ba-color-fg-hint": theme.ui.fg.hint,
        "--ba-color-fg-disabled": theme.ui.fg.disabled,
        "--ba-color-fg-contrast": theme.ui.fg.contrast,

        // Intents (pips, labels, outlines)
        "--ba-color-fg-positive": theme.ui.fg.positive,
        "--ba-color-fg-warn": theme.ui.fg.warn,
        "--ba-color-fg-negative": theme.ui.fg.negative,
        "--ba-color-fg-info": theme.ui.fg.info,
    };
}

/**
 * Generates the :root CSS block that ThemeProvider injects. Also sets
 * color-scheme from the theme's appearance, so non-overridden tokens
 * (which use light-dark()) resolve on the matching side.
 */
export function themeToStyleSheet(theme: ThemeDefinition): string {
    const properties = themeToCustomProperties(theme);
    const declarations = Object.entries(properties)
        .map(([prop, value]) => `    ${prop}: ${value};`)
        .join("\n");

    return `:root {\n    color-scheme: ${theme.meta.appearance};\n${declarations}\n}`;
}
