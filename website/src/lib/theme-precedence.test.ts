import { describe, expect, it } from "vite-plus/test";
import { themeKeys } from "@black-atom/core";
import {
    fromShortKey,
    resolveThemeKey,
    siblingThemeKey,
    stepThemeKey,
    toShortKey,
} from "./theme-precedence.ts";

describe("resolveThemeKey", () => {
    it("prefers the URL key over the stored key and the system preference", () => {
        expect(
            resolveThemeKey({
                urlShortKey: "jpn-murasaki-light",
                storedKey: "black-atom-terra-fall-dark",
                systemAppearance: "dark",
            }),
        ).toBe("black-atom-jpn-murasaki-light");
    });

    it("falls back to the stored key when the URL has none", () => {
        expect(
            resolveThemeKey({
                urlShortKey: undefined,
                storedKey: "black-atom-terra-fall-dark",
                systemAppearance: "light",
            }),
        ).toBe("black-atom-terra-fall-dark");
    });

    it("falls back to the stored key when the URL key is unknown", () => {
        expect(
            resolveThemeKey({
                urlShortKey: "no-such-theme",
                storedKey: "black-atom-mono-light",
                systemAppearance: "dark",
            }),
        ).toBe("black-atom-mono-light");
    });

    it("uses the default theme of the system appearance when nothing else is set", () => {
        expect(
            resolveThemeKey({
                urlShortKey: undefined,
                storedKey: undefined,
                systemAppearance: "dark",
            }),
        ).toBe("black-atom-default-dark");
        expect(
            resolveThemeKey({ urlShortKey: "", storedKey: undefined, systemAppearance: "light" }),
        ).toBe("black-atom-default-light");
    });
});

describe("short keys", () => {
    it("drop the black-atom- prefix", () => {
        expect(toShortKey("black-atom-jpn-murasaki-light")).toBe("jpn-murasaki-light");
        expect(toShortKey("black-atom-default-dark")).toBe("default-dark");
    });

    it("round-trip for every catalog theme", () => {
        for (const key of themeKeys) expect(fromShortKey(toShortKey(key))).toBe(key);
    });

    it("reject unknown keys and full keys", () => {
        expect(fromShortKey("no-such-theme")).toBeUndefined();
        expect(fromShortKey("")).toBeUndefined();
        expect(fromShortKey("black-atom-default-dark")).toBeUndefined();
        expect(fromShortKey("constructor")).toBeUndefined();
    });
});

describe("siblingThemeKey", () => {
    it("swaps the appearance within the same theme", () => {
        expect(siblingThemeKey("black-atom-jpn-murasaki-light")).toBe(
            "black-atom-jpn-murasaki-dark",
        );
        expect(siblingThemeKey("black-atom-default-dimmed-dark")).toBe(
            "black-atom-default-dimmed-light",
        );
        expect(siblingThemeKey("black-atom-mono-dark")).toBe("black-atom-mono-light");
    });

    it("has no sibling for a theme with one appearance", () => {
        expect(siblingThemeKey("black-atom-jpn-tsuki-dark")).toBeUndefined();
    });
});

describe("stepThemeKey", () => {
    it("moves through the catalog and wraps at both ends", () => {
        const first = themeKeys[0];
        const last = themeKeys[themeKeys.length - 1];

        expect(stepThemeKey(first, 1)).toBe(themeKeys[1]);
        expect(stepThemeKey(first, -1)).toBe(last);
        expect(stepThemeKey(last, 1)).toBe(first);
    });
});
