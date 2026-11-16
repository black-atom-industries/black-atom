import { Store } from "@tanstack/react-store";
import { z } from "zod";
import type * as Theme from "@black-atom/core";
import { isThemeKey } from "#/lib/theme-precedence.ts";

export const themeStorageKey = "ba-theme";

const storedThemeKeySchema = z.string().refine(isThemeKey);

function readStoredThemeKey(): Theme.Key | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const stored = storedThemeKeySchema.safeParse(localStorage.getItem(themeStorageKey));
        return stored.success ? stored.data : undefined;
    } catch {
        return undefined;
    }
}

export const themeStore = new Store<Theme.Key | undefined>(readStoredThemeKey());

themeStore.subscribe((key) => {
    if (key === undefined) return;
    try {
        localStorage.setItem(themeStorageKey, key);
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the URL still carries the theme.
    }
});
