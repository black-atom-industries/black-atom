import { describe, expect, it } from "vite-plus/test";
import { themeCatalog } from "@black-atom/core";
import { themeCollections } from "./theme-collections.ts";
import { familyVariant, groupThemeFamilies, themeFamilyName } from "./theme-families.ts";

describe("themeFamilyName", () => {
    it("drops a trailing appearance word", () => {
        expect(themeFamilyName("Koyo Dark", "JPN")).toBe("Koyo");
        expect(themeFamilyName("Dimmed Dark", "JPN")).toBe("Dimmed");
    });

    it("falls back to the collection when only the appearance word is left", () => {
        expect(themeFamilyName("Light", "JPN")).toBe("JPN");
    });
});

describe("groupThemeFamilies", () => {
    const jpn = themeCollections.find((entry) =>
        entry.themes.some((theme) => theme.meta.key === "black-atom-jpn-koyo-dark"),
    );
    const families = groupThemeFamilies(jpn?.themes ?? []);

    it("keeps every theme of the collection in exactly one family", () => {
        expect(families.flatMap((family) => family.themes)).toHaveLength(jpn?.themes.length ?? -1);
    });

    it("puts both appearances of one theme in one family", () => {
        const koyo = families.find((family) => family.name === "Koyo");
        expect(koyo?.themes.map((theme) => theme.meta.key)).toEqual([
            "black-atom-jpn-koyo-dark",
            "black-atom-jpn-koyo-light",
        ]);
    });

    it("picks the family's theme in the requested appearance", () => {
        const koyo = families.find((family) => family.name === "Koyo");
        expect(koyo && familyVariant(koyo, "light").meta.key).toBe("black-atom-jpn-koyo-light");
    });

    it("falls back to the family's first theme when its appearance does not exist", () => {
        const tsuki = groupThemeFamilies([themeCatalog["black-atom-jpn-tsuki-dark"]])[0];
        expect(familyVariant(tsuki, "light").meta.key).toBe("black-atom-jpn-tsuki-dark");
    });
});
