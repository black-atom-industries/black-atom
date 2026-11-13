import type * as Theme from "@black-atom/core";

export interface ChangedToken {
    /** Dot path of the token, such as `ui.fg.border`. */
    path: string;
    /** The color before, absent when the token did not exist. */
    before: string | undefined;
    after: string;
}

const colorGroups = ["primaries", "accents", "palette", "feedback", "ui", "syntax"] as const;

function flattenColors(value: unknown, path: string): [string, string][] {
    if (typeof value === "string") return [[path, value]];
    if (typeof value !== "object" || value === null) return [];
    return Object.entries(value).flatMap(([key, child]) => flattenColors(child, `${path}.${key}`));
}

function colorsOf(theme: Theme.Definition): Map<string, string> {
    return new Map(colorGroups.flatMap((group) => flattenColors(theme[group], group)));
}

/** The tokens of `after` whose color differs from `before`, in definition order. */
export function changedTokens(before: Theme.Definition, after: Theme.Definition): ChangedToken[] {
    const previous = colorsOf(before);
    return [...colorsOf(after)]
        .filter(([path, color]) => previous.get(path) !== color)
        .map(([path, color]) => ({ path, before: previous.get(path), after: color }));
}
