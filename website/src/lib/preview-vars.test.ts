import { describe, expect, it } from "vite-plus/test";
import { themeCatalog } from "@black-atom/core";
import { themeToPreviewProperties } from "./preview-vars.ts";

const hexColor = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

describe("themeToPreviewProperties", () => {
    const themes = Object.values(themeCatalog);

    it.each(themes.map((theme) => [theme.meta.key, theme] as const))(
        "maps %s to a hex color for every variable",
        (_key, theme) => {
            const entries = Object.entries(themeToPreviewProperties(theme));

            expect(entries.length).toBeGreaterThan(60);
            for (const [name, value] of entries) {
                expect(name).toMatch(/^--tp-[a-z0-9-]+$/);
                expect(value, name).toMatch(hexColor);
            }
        },
    );

    it("emits the same variable names for every theme", () => {
        const [first, ...rest] = themes.map((theme) =>
            Object.keys(themeToPreviewProperties(theme)).toSorted(),
        );
        for (const names of rest) expect(names).toEqual(first);
    });

    it("covers the tokens the previews read beyond the site chrome", () => {
        const theme = themeCatalog["black-atom-jpn-murasaki-dark"];
        const properties = themeToPreviewProperties(theme);

        expect(properties["--tp-bg-search"]).toBe(theme.ui.bg.search);
        expect(properties["--tp-bg-add"]).toBe(theme.ui.bg.add);
        expect(properties["--tp-fg-border"]).toBe(theme.ui.fg.border);
        expect(properties["--tp-syn-parameter"]).toBe(theme.syntax.variable.parameter);
        expect(properties["--tp-c-dark-red"]).toBe(theme.palette.darkRed);
    });

    it("draws lines in the given border color", () => {
        const theme = themeCatalog["black-atom-jpn-murasaki-dark"];
        const properties = themeToPreviewProperties(theme, { borderColor: theme.ui.fg.subtle });

        expect(properties["--tp-fg-border"]).toBe(theme.ui.fg.subtle);
    });
});
