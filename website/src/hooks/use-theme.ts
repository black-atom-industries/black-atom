import { useSyncExternalStore } from "react";
import { DEFAULT_THEME_KEY, themeCatalog } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import { useHydrated, useNavigate, useSearch } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { resolveThemeKey, toShortKey, type Appearance } from "#/lib/theme-precedence.ts";
import { themeStore } from "#/stores/theme.ts";

const lightQuery = "(prefers-color-scheme: light)";

function subscribeToSystemAppearance(onChange: () => void) {
    const list = window.matchMedia(lightQuery);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
}

function useSystemAppearance(): Appearance {
    return useSyncExternalStore(
        subscribeToSystemAppearance,
        () => (window.matchMedia(lightQuery).matches ? "light" : "dark"),
        () => "dark",
    );
}

export function useTheme(): { theme: Theme.Definition; setTheme: (key: Theme.Key) => void } {
    const search = useSearch({ from: "__root__" });
    const navigate = useNavigate();
    const isHydrated = useHydrated();
    const storedKey = useSelector(themeStore);
    const systemAppearance = useSystemAppearance();

    // Storage and the system preference are unknown during SSR, so they count only after hydration.
    const key = resolveThemeKey({
        urlShortKey: search.theme,
        storedKey: isHydrated ? storedKey : undefined,
        systemAppearance: isHydrated ? systemAppearance : "dark",
    });

    function setTheme(next: Theme.Key) {
        themeStore.setState(() => next);
        void navigate({
            to: ".",
            search: (prev) => ({
                ...prev,
                theme: next === DEFAULT_THEME_KEY ? undefined : toShortKey(next),
            }),
            replace: true,
            resetScroll: false,
        });
    }

    return { theme: themeCatalog[key], setTheme };
}
