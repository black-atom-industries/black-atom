import { useLayoutEffect, type ReactNode } from "react";
import { DEFAULT_THEME_KEY, themeCatalog } from "@black-atom/core";
import type { Decorator } from "@storybook/react-vite";
import { isThemeKey } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";

// Base UI portals popups into `body`, so the variables sit on `<html>` like on the site.
function ThemeRoot({ themeKey, children }: { themeKey: unknown; children: ReactNode }) {
    const key = typeof themeKey === "string" && isThemeKey(themeKey) ? themeKey : DEFAULT_THEME_KEY;
    const theme = themeCatalog[key];

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme.meta.key;
        root.dataset.appearance = theme.meta.appearance;
        root.style.colorScheme = theme.meta.appearance;
        for (const [name, value] of Object.entries(themeToCustomProperties(theme))) {
            root.style.setProperty(name, value);
        }
    }, [theme]);

    return children;
}

export const themeDecorator: Decorator = (Story, context) => (
    <ThemeRoot themeKey={context.globals.theme}>
        <Story />
    </ThemeRoot>
);
