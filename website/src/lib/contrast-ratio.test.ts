import { describe, expect, it } from "vite-plus/test";
import { analyzeThemeContrast } from "@black-atom/core/contrast";
import { themeCatalog, themeKeys } from "@black-atom/core";
import { contrastRatio } from "./contrast-ratio.ts";

describe("contrastRatio", () => {
    it("gives 21 for black on white, in either order", () => {
        expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
        expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    });

    it("gives 1 for a color on itself", () => {
        expect(contrastRatio("#3a7bd5", "#3a7bd5")).toBeCloseTo(1, 5);
    });

    it("agrees with the ratios core reports for every theme pair", () => {
        for (const key of themeKeys) {
            for (const category of analyzeThemeContrast(themeCatalog[key]).categories) {
                for (const pair of category.pairs) {
                    expect(contrastRatio(pair.fg.color, pair.bg.color)).toBeCloseTo(pair.ratio, 1);
                }
            }
        }
    });
});
