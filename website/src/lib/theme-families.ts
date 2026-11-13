import type * as Theme from "@black-atom/core";
import type { Appearance } from "./theme-precedence.ts";

export type ThemeFamily<T extends Theme.Definition = Theme.Definition> = {
    name: string;
    themes: readonly T[];
};

/** A theme's name without its appearance word: "Koyo" for "Koyo Dark", the collection when nothing remains. */
export function themeFamilyName(name: string, collectionLabel: string): string {
    return name.replace(/\s*(Dark|Light)$/, "") || collectionLabel;
}

/** Groups themes into families, in the order each family first appears. */
export function groupThemeFamilies<T extends Theme.Definition>(
    themes: readonly T[],
): ThemeFamily<T>[] {
    const families = new Map<string, T[]>();
    for (const theme of themes) {
        const name = themeFamilyName(theme.meta.name, theme.meta.collection.label);
        families.set(name, [...(families.get(name) ?? []), theme]);
    }
    return [...families].map(([name, members]) => ({ name, themes: members }));
}

/** The family's theme in an appearance, or its first theme when the family has none there. */
export function familyVariant<T extends Theme.Definition>(
    family: ThemeFamily<T>,
    appearance: Appearance,
): T {
    return family.themes.find((theme) => theme.meta.appearance === appearance) ?? family.themes[0];
}
