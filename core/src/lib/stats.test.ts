import { assert, test } from "vitest";
import { collectionStats, orgStats, themeContrast } from "./stats.ts";

const darkTheme = {
    meta: {
        key: "test-dark",
        name: "Dark",
        appearance: "dark" as const,
        status: "release" as const,
        collection: { key: "default", label: "Default" },
    },
    ui: { fg: { default: "#c5cad0" }, bg: { default: "#1a1d23" } },
} as unknown as Parameters<typeof themeContrast>[0];

const lightTheme = {
    meta: {
        key: "test-light",
        name: "Light",
        appearance: "light" as const,
        status: "release" as const,
        collection: { key: "default", label: "Default" },
    },
    ui: { fg: { default: "#353230" }, bg: { default: "#f0ece7" } },
} as unknown as Parameters<typeof themeContrast>[0];

test("themeContrast returns ratio and WCAG level", () => {
    const result = themeContrast(darkTheme);
    assert.deepEqual(typeof result.ratio, "number");
    assert.deepEqual(result.ratio > 1, true);
    assert.deepEqual(["AAA", "AA", "fail"].includes(result.level), true);
});

test("themeContrast uses ui.fg.default vs ui.bg.default", () => {
    const result = themeContrast(darkTheme);
    assert.deepEqual(result.ratio > 7, true);
    assert.deepEqual(result.level, "AAA");
});

test("collectionStats computes counts and avg contrast", () => {
    const result = collectionStats([darkTheme, lightTheme]);
    assert.deepEqual(result.themeCount, 2);
    assert.deepEqual(result.darkCount, 1);
    assert.deepEqual(result.lightCount, 1);
    assert.deepEqual(typeof result.avgContrast, "number");
    assert.deepEqual(result.avgContrast > 1, true);
});

test("collectionStats with single theme", () => {
    const result = collectionStats([darkTheme]);
    assert.deepEqual(result.themeCount, 1);
    assert.deepEqual(result.darkCount, 1);
    assert.deepEqual(result.lightCount, 0);
});

const jpnTheme = {
    meta: {
        key: "test-jpn",
        name: "Koyo",
        appearance: "dark" as const,
        status: "release" as const,
        collection: { key: "jpn", label: "JPN" },
    },
    ui: { fg: { default: "#c5cad0" }, bg: { default: "#1a1d23" } },
} as unknown as Parameters<typeof themeContrast>[0];

test("orgStats aggregates across all themes", () => {
    const result = orgStats([darkTheme, lightTheme, jpnTheme]);
    assert.deepEqual(result.themeCount, 3);
    assert.deepEqual(result.collectionCount, 2);
    assert.deepEqual(result.darkCount, 2);
    assert.deepEqual(result.lightCount, 1);
    assert.deepEqual(typeof result.avgContrast, "number");
});

test("collectionStats handles empty array", () => {
    const result = collectionStats([]);
    assert.deepEqual(result.themeCount, 0);
    assert.deepEqual(result.avgContrast, 0);
});

test("orgStats handles empty array", () => {
    const result = orgStats([]);
    assert.deepEqual(result.themeCount, 0);
    assert.deepEqual(result.collectionCount, 0);
    assert.deepEqual(result.avgContrast, 0);
});
