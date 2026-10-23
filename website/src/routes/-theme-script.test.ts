import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vite-plus/test";
import { themeScript } from "./-theme-script.ts";

function runScript({
    search = "",
    stored = null,
    isSystemLight = false,
}: {
    search?: string;
    stored?: string | null;
    isSystemLight?: boolean;
}) {
    const properties = new Map<string, string>();
    const attributes = new Map<string, string>();
    const style = {
        colorScheme: "",
        setProperty: (name: string, value: string) => properties.set(name, value),
    };
    const document = {
        documentElement: {
            style,
            setAttribute: (name: string, value: string) => attributes.set(name, value),
        },
    };
    const localStorage = { getItem: () => stored };
    const matchMedia = () => ({ matches: isSystemLight });
    const location = { search };

    runInNewContext(themeScript, {
        document,
        localStorage,
        matchMedia,
        location,
        URLSearchParams,
    });

    return {
        theme: attributes.get("data-theme"),
        appearance: attributes.get("data-appearance"),
        colorScheme: style.colorScheme,
        bg: properties.get("--ba-bg"),
        propertyCount: properties.size,
    };
}

describe("themeScript", () => {
    it("leaves a valid URL theme to SSR, even with a stored theme", () => {
        const result = runScript({
            search: "?theme=jpn-murasaki-light",
            stored: "black-atom-terra-fall-dark",
        });
        expect(result.theme).toBeUndefined();
        expect(result.propertyCount).toBe(0);
    });

    it("reads a JSON-quoted URL theme like the router does", () => {
        const result = runScript({
            search: "?theme=%22jpn-koyo-dark%22",
            stored: "black-atom-mono-light",
        });
        expect(result.theme).toBeUndefined();
    });

    it("applies the stored theme on a bare URL", () => {
        const result = runScript({ stored: "black-atom-jpn-koyo-dark", isSystemLight: true });
        expect(result).toMatchObject({
            theme: "black-atom-jpn-koyo-dark",
            appearance: "dark",
            colorScheme: "dark",
            bg: "#261a2a",
        });
        expect(result.propertyCount).toBe(35);
    });

    it("applies the stored theme when the URL theme is unknown", () => {
        const result = runScript({ search: "?theme=bogus", stored: "black-atom-mono-light" });
        expect(result.theme).toBe("black-atom-mono-light");
    });

    it("applies the light default on a light system without a stored theme", () => {
        const result = runScript({ isSystemLight: true });
        expect(result).toMatchObject({
            theme: "black-atom-default-light",
            appearance: "light",
            colorScheme: "light",
        });
    });

    it("ignores an unknown stored key and falls back to the system preference", () => {
        expect(runScript({ stored: "toString", isSystemLight: true }).theme).toBe(
            "black-atom-default-light",
        );
        expect(runScript({ stored: "no-such-theme" }).theme).toBeUndefined();
    });

    it("leaves SSR's default dark in place on a dark system without a stored theme", () => {
        expect(runScript({}).propertyCount).toBe(0);
    });
});
