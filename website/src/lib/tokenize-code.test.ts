import { describe, expect, it } from "vite-plus/test";
import { tokenize } from "./tokenize-code.ts";

function groups(text: string): string[] {
    return tokenize(text).flatMap(([word, group]) => (group ? [`${word}:${group}`] : []));
}

describe("tokenize", () => {
    it("splits a statement into syntax groups", () => {
        expect(groups("const MAX = 42;")).toEqual([
            "const:keyword",
            "MAX:constant",
            "=:operator",
            "42:number",
            ";:punctuation",
        ]);
    });

    it("tells calls, properties, types and strings apart", () => {
        expect(groups('new Error(file.name, "too long")')).toEqual([
            "new:keyword",
            "Error:constructor",
            "(:punctuation",
            "file:variable",
            ".:punctuation",
            "name:property",
            ",:punctuation",
            '"too long":string',
            "):punctuation",
        ]);
        expect(groups("load(file)")).toContain("load:func");
    });

    it("keeps a trailing comment as one token", () => {
        expect(tokenize("return x; // done").at(-1)).toEqual(["// done", "comment"]);
    });

    it("keeps whitespace without a group, so the line can be rebuilt", () => {
        const text = "  if (a > b) {";
        expect(
            tokenize(text)
                .map(([word]) => word)
                .join(""),
        ).toBe(text);
    });
});
