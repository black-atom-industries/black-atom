import { themeCatalog, themeKeys } from "@black-atom/core";
import { defaultThemeKeys } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { themeStorageKey } from "#/stores/theme.ts";

const varNames = Object.keys(themeToCustomProperties(themeCatalog[defaultThemeKeys.dark]));

const themes = Object.fromEntries(
    themeKeys.map((key) => {
        const theme = themeCatalog[key];
        return [key, [theme.meta.appearance, ...Object.values(themeToCustomProperties(theme))]];
    }),
);

const data = JSON.stringify({
    storageKey: themeStorageKey,
    lightKey: defaultThemeKeys.light,
    names: varNames,
    themes,
});

/**
 * Runs before first paint. SSR already wrote a valid URL theme onto <html>; without one, this
 * applies the stored theme, or the light default on a light system, so the page never flashes dark.
 * Mirrors resolveThemeKey in lib/theme-precedence.ts, and reads `?theme=` the way the router's
 * JSON search parser does.
 */
export const themeScript = `(function (d) {
    try {
        var has = function (k) { return Object.prototype.hasOwnProperty.call(d.themes, k); };
        var url = new URLSearchParams(location.search).get("theme");
        try { url = JSON.parse(url); } catch (e) {}
        if (typeof url === "string" && has("black-atom-" + url)) return;
        var key = localStorage.getItem(d.storageKey);
        if (!key || !has(key)) key = matchMedia("(prefers-color-scheme: light)").matches ? d.lightKey : null;
        if (!key) return;
        var t = d.themes[key], h = document.documentElement;
        for (var i = 0; i < d.names.length; i++) h.style.setProperty(d.names[i], t[i + 1]);
        h.style.colorScheme = t[0];
        h.setAttribute("data-theme", key);
        h.setAttribute("data-appearance", t[0]);
    } catch (e) {}
})(${data});`;
