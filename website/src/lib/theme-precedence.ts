import { DEFAULT_THEME_KEY, themeCatalog, themeKeys } from "@black-atom/core";
import type * as Theme from "@black-atom/core";

export type Appearance = Theme.Definition["meta"]["appearance"];

const keyPrefix = "black-atom-";

export const defaultThemeKeys = {
    dark: DEFAULT_THEME_KEY,
    light: "black-atom-default-light",
} as const satisfies Record<Appearance, Theme.Key>;

export function isThemeKey(key: string): key is Theme.Key {
    return Object.hasOwn(themeCatalog, key);
}

export function toShortKey(key: Theme.Key): string {
    return key.slice(keyPrefix.length);
}

export function fromShortKey(shortKey: string): Theme.Key | undefined {
    const key = keyPrefix + shortKey;
    return isThemeKey(key) ? key : undefined;
}

export function resolveThemeKey({
    urlShortKey,
    storedKey,
    systemAppearance,
}: {
    urlShortKey: string | undefined;
    storedKey: Theme.Key | undefined;
    systemAppearance: Appearance;
}): Theme.Key {
    const urlKey = urlShortKey === undefined ? undefined : fromShortKey(urlShortKey);
    return urlKey ?? storedKey ?? defaultThemeKeys[systemAppearance];
}

export function siblingThemeKey(key: Theme.Key): Theme.Key | undefined {
    const { appearance } = themeCatalog[key].meta;
    const other = appearance === "dark" ? "light" : "dark";
    if (!key.endsWith(`-${appearance}`)) return undefined;
    const sibling = `${key.slice(0, -appearance.length)}${other}`;
    return isThemeKey(sibling) ? sibling : undefined;
}

export function stepThemeKey(key: Theme.Key, delta: number): Theme.Key {
    const index = themeKeys.indexOf(key);
    return themeKeys[(index + delta + themeKeys.length) % themeKeys.length];
}
