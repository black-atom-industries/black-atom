import { describe, expect, it } from "vite-plus/test";
import { themeCatalog } from "@black-atom/core";
import { tallyContrast, themeContrastRatios } from "./contrast-summary.ts";

describe("tallyContrast", () => {
    it("counts each grade and the share at 3:1 or better", () => {
        const tally = tallyContrast([7, 8, 4.5, 3, 2.99, 1]);

        expect(tally.total).toBe(6);
        expect(tally.counts).toEqual({ aaa: 2, aa: 1, large: 1, low: 2 });
        expect(tally.readableShare).toBeCloseTo(4 / 6, 10);
    });

    it("has no share when there are no pairs", () => {
        expect(tallyContrast([])).toEqual({
            total: 0,
            counts: { aaa: 0, aa: 0, large: 0, low: 0 },
            readableShare: 0,
        });
    });
});

describe("themeContrastRatios", () => {
    it("returns a ratio for every pair in the theme's analysis", () => {
        const ratios = themeContrastRatios(themeCatalog["black-atom-jpn-koyo-dark"]);

        expect(ratios.length).toBeGreaterThan(0);
        expect(ratios.every((ratio) => ratio >= 1)).toBe(true);
    });
});
