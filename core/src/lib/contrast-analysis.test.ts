import { assert, test } from "vitest";
import { analyzeThemeContrast, INTENDED_PAIRINGS } from "./contrast-analysis.ts";
import type * as Theme from "../types/theme.ts";

test("INTENDED_PAIRINGS has all expected categories", () => {
    const names = INTENDED_PAIRINGS.map((c) => c.name);
    assert.deepEqual(names, [
        "Content on surfaces",
        "Interactive states",
        "Feedback",
        "Diff",
        "Contrast inversion",
    ]);
});

test("each pairing has fg and bg keys", () => {
    for (const category of INTENDED_PAIRINGS) {
        for (const pair of category.pairs) {
            assert.deepEqual(typeof pair.fg, "string");
            assert.deepEqual(typeof pair.bg, "string");
            assert.deepEqual(pair.fg.startsWith("fg."), true, `${pair.fg} should start with fg.`);
            assert.deepEqual(pair.bg.startsWith("bg."), true, `${pair.bg} should start with bg.`);
        }
    }
});

const testTheme = {
    meta: { key: "test-theme" },
    ui: {
        bg: {
            default: "#1a1d23",
            panel: "#1e2128",
            float: "#22252c",
            active: "#2a2d35",
            disabled: "#2e3138",
            hover: "#262930",
            selection: "#2a3040",
            search: "#2a3530",
            contrast: "#e0e0e0",
            negative: "#3a1a1a",
            warn: "#3a3a1a",
            info: "#1a2a3a",
            hint: "#2a2a3a",
            positive: "#1a3a1a",
            add: "#1a3a2a",
            delete: "#3a1a2a",
            modify: "#2a2a3a",
        },
        fg: {
            default: "#c5cad0",
            subtle: "#8a8f96",
            accent: "#7aaa8a",
            disabled: "#555a60",
            contrast: "#1a1d23",
            negative: "#e06060",
            warn: "#d0a030",
            info: "#6090d0",
            hint: "#8080b0",
            positive: "#60b060",
            add: "#60c060",
            delete: "#d06060",
            modify: "#8080d0",
        },
    },
} as unknown as Theme.Definition;

test("analyzeThemeContrast returns correct structure", () => {
    const result = analyzeThemeContrast(testTheme);
    assert.deepEqual(typeof result.primary.ratio, "number");
    assert.deepEqual(result.primary.fg.key, "fg.default");
    assert.deepEqual(result.primary.bg.key, "bg.default");
    assert.deepEqual(result.categories.length, INTENDED_PAIRINGS.length);
    assert.isAbove(result.passRate.aa, 0);
    assert.isAtMost(result.passRate.aa, 1);
    assert.isAbove(result.passRate.aaa, 0);
    assert.isAtMost(result.passRate.aaa, 1);
    assert.deepEqual(typeof result.worstPair.ratio, "number");
});

test("analyzeThemeContrast primary pair matches fg.default/bg.default", () => {
    const result = analyzeThemeContrast(testTheme);
    assert.deepEqual(result.primary.fg.color, "#c5cad0");
    assert.deepEqual(result.primary.bg.color, "#1a1d23");
    assert.isAbove(result.primary.ratio, 7);
    assert.deepEqual(result.primary.level, "AAA");
});

test("analyzeThemeContrast worstPair has lowest ratio", () => {
    const result = analyzeThemeContrast(testTheme);
    const allPairs = result.categories.flatMap((c) => c.pairs);
    const minRatio = Math.min(...allPairs.map((p) => p.ratio));
    assert.deepEqual(result.worstPair.ratio, minRatio);
});

test("analyzeThemeContrast pass rates are consistent with pairs", () => {
    const result = analyzeThemeContrast(testTheme);
    const allPairs = result.categories.flatMap((c) => c.pairs);
    const total = allPairs.length;
    const aaCount = allPairs.filter((p) => p.level === "AA" || p.level === "AAA").length;
    const aaaCount = allPairs.filter((p) => p.level === "AAA").length;
    assert.deepEqual(result.passRate.aa, aaCount / total);
    assert.deepEqual(result.passRate.aaa, aaaCount / total);
});

test("analyzeThemeContrast throws on missing token", () => {
    const incompleteTheme = {
        meta: { key: "incomplete" },
        ui: {
            bg: { default: "#1a1d23" },
            fg: { default: "#c5cad0" },
        },
    } as unknown as Theme.Definition;

    assert.throws(
        () => analyzeThemeContrast(incompleteTheme),
    );
});
