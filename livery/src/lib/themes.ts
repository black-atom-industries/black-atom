import { collectionOrder, themeCatalog } from "@black-atom/core";
import type * as Theme from "@black-atom/core";

/**
 * What livery wears before anything is recorded, and what `livery setup`
 * applies when it is not asked interactively. Kept in step with
 * DEFAULT_THEME_KEY in livery/cli/src/commands.rs.
 */
export const defaultTheme: Theme.Definition = themeCatalog["black-atom-default-dark"];

export interface ThemeGroup {
    collectionKey: Theme.CollectionKey;
    label: string;
    themes: Theme.Definition[];
}

/**
 * "JPN — JAPAN" when core ships a distinct display label; plain "JPN" while
 * the label merely echoes the key (which it currently does for every
 * collection — the em-dash form activates itself once core grows real names).
 */
export function formatCollectionTitle(key: string, label: string): string {
    const keyUpper = key.toUpperCase();
    const labelUpper = label.toUpperCase();
    return keyUpper === labelUpper ? keyUpper : `${keyUpper} — ${labelUpper}`;
}

/** Group themes by collection in display order. Sorts themes within each group by name. */
export function getGroupedThemes(themeCatalog: Theme.DefinitionMap): ThemeGroup[] {
    const themes = Object.values(themeCatalog).filter(
        (theme): theme is Theme.Definition => theme !== undefined,
    );

    const grouped = themes.reduce((acc, theme) => {
        const key = theme.meta.collection.key;
        if (!acc.has(key)) acc.set(key, []);
        acc.get(key)!.push(theme);
        return acc;
    }, new Map<Theme.CollectionKey, Theme.Definition[]>());

    grouped.forEach((group) => group.sort((a, b) => a.meta.name.localeCompare(b.meta.name)));

    return collectionOrder
        .filter((key) => grouped.has(key))
        .map((key) => {
            const themes = grouped.get(key)!;
            return {
                collectionKey: key,
                label: themes[0].meta.collection.label,
                themes,
            };
        });
}

/**
 * A random theme distinct from `currentKey` — TEST APPLY needs a visible
 * change, so it never picks the theme already active. `random` is injected
 * (defaults to Math.random) so the pick is deterministic under test.
 */
export function pickRandomOtherTheme(
    themeCatalog: Theme.DefinitionMap,
    currentKey: string,
    random: () => number = Math.random,
): Theme.Definition | null {
    const candidates = Object.values(themeCatalog).filter(
        (theme): theme is Theme.Definition => theme !== undefined && theme.meta.key !== currentKey,
    );
    if (candidates.length === 0) return null;
    return candidates[Math.floor(random() * candidates.length)];
}
