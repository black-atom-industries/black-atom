import { describe, expect, it } from "vite-plus/test";
import { themeCatalog } from "@black-atom/core";
import { themeToCustomProperties } from "./theme-vars.ts";

const hexColor = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

describe("themeToCustomProperties", () => {
    const themes = Object.values(themeCatalog);

    it.each(themes.map((theme) => [theme.meta.key, theme] as const))(
        "maps %s to a hex color for every variable",
        (_key, theme) => {
            const properties = themeToCustomProperties(theme);
            const entries = Object.entries(properties);

            expect(entries.length).toBeGreaterThan(0);
            for (const [name, value] of entries) {
                expect(name).toMatch(/^--ba-[a-z0-9-]+$/);
                expect(value, name).toMatch(hexColor);
            }
        },
    );

    it("emits the same variable names for every theme", () => {
        const [first, ...rest] = themes.map((theme) =>
            Object.keys(themeToCustomProperties(theme)).toSorted(),
        );
        for (const names of rest) expect(names).toEqual(first);
    });

    it("reads the accent from the theme's accents, not its primaries", () => {
        const theme = themeCatalog["black-atom-jpn-murasaki-light"];
        const properties = themeToCustomProperties(theme);

        expect(properties["--ba-accent"]).toBe(theme.accents.a10);
        expect(properties["--ba-bg"]).toBe(theme.ui.bg.default);
        expect(properties["--ba-syn-keyword"]).toBe(theme.syntax.keyword.default);
        expect(properties["--ba-c-red"]).toBe(theme.palette.red);
    });
});
