import { describe, expect, it } from "vite-plus/test";
import { formatOklch } from "./format-oklch.ts";

describe("formatOklch", () => {
    it.each([
        ["#ffffff", "oklch(1.00 0.000 0)"],
        ["#000000", "oklch(0.00 0.000 0)"],
        ["#808080", "oklch(0.60 0.000 0)"],
        ["#ff0000", "oklch(0.63 0.258 29)"],
    ])("formats %s as %s", (hex, expected) => {
        expect(formatOklch(hex)).toBe(expected);
    });
});
