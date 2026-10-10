import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assert, expect, test as vitestTest } from "vitest";
import { join } from "node:path";
import {
    adjustPaletteSuggestion,
    extractPaletteFromImage,
    generatePrimariesFromSuggestion,
} from "./palette-from-image.ts";

async function hasMagick(): Promise<boolean> {
    try {
        await promisify(execFile)("magick", ["-version"]);
        return true;
    } catch {
        return false;
    }
}

const test = vitestTest.skipIf(!(await hasMagick()));

const testImagePath = join(
    import.meta.dirname ?? ".",
    "..",
    "..",
    "test",
    "fixtures",
    "test_image.jpg",
);

test("extractPaletteFromImage - valid image", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
        numColors: 10,
        appearance: "auto",
    });

    assert.deepEqual(result.dominantColors.length, 10);
    assert.exists(result.suggestions);
    assert.deepEqual(result.suggestions.length, 3);

    result.dominantColors.forEach((color) => {
        assert.deepEqual(typeof color.hex, "string");
        assert.deepEqual(color.oklch.l >= 0 && color.oklch.l <= 1, true);
        assert.deepEqual(color.oklch.c >= 0, true);
        assert.deepEqual(color.oklch.h >= 0 && color.oklch.h < 360, true);
        assert.deepEqual(color.percentage > 0, true);
    });

    assert.exists(result.metadata);
    assert.deepEqual(typeof result.metadata.avgLightness, "number");
    assert.deepEqual(typeof result.metadata.avgChroma, "number");
    assert.deepEqual(["dark", "light", "both"].includes(result.metadata.suggestedAppearance), true);
});

test("extractPaletteFromImage - image not found", async () => {
    await expect(
        extractPaletteFromImage({
            imagePath: "./non-existent-image.jpg",
        }),
    ).rejects.toThrow("Image not found");
});

test("generatePrimariesFromSuggestion - dark theme", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const suggestion = result.suggestions[0];
    const code = generatePrimariesFromSuggestion(suggestion, "dark");

    assert.deepEqual(code.includes("const primaries: Theme.Primaries"), true);
    assert.deepEqual(code.includes("d10:"), true);
    assert.deepEqual(code.includes("d20:"), true);
    assert.deepEqual(code.includes("d30:"), true);
    assert.deepEqual(code.includes("d40:"), true);
    assert.deepEqual(code.includes("m10:"), true);
    assert.deepEqual(code.includes("m20:"), true);
    assert.deepEqual(code.includes("m30:"), true);
    assert.deepEqual(code.includes("m40:"), true);
    assert.deepEqual(code.includes("l10:"), true);
    assert.deepEqual(code.includes("l20:"), true);
    assert.deepEqual(code.includes("l30:"), true);
    assert.deepEqual(code.includes("l40:"), true);
    assert.deepEqual(code.includes("oklch("), true);
});

test("generatePrimariesFromSuggestion - light theme", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const suggestion = result.suggestions[0];
    const code = generatePrimariesFromSuggestion(suggestion, "light");

    assert.deepEqual(code.includes("const primaries: Theme.Primaries"), true);

    const lightnessValues = code.match(/oklch\(([0-9.]+),/g);
    assert.exists(lightnessValues);
    assert.deepEqual(lightnessValues.length, 12);
});

test("adjustPaletteSuggestion - hue shift", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { hueShift: 15 });

    const expectedHue = (original.accent.h + 15) % 360;
    assert.deepEqual(Math.abs(adjusted.accent.h - expectedHue) < 0.01, true);
    assert.deepEqual(adjusted.accent.l, original.accent.l);
    assert.deepEqual(adjusted.accent.c, original.accent.c);
});

test("adjustPaletteSuggestion - chroma multiplier", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { chromaMultiplier: 1.5 });

    assert.deepEqual(Math.abs(adjusted.accent.c - original.accent.c * 1.5) < 0.001, true);
    assert.deepEqual(adjusted.accent.l, original.accent.l);
    assert.deepEqual(adjusted.accent.h, original.accent.h);
});

test("adjustPaletteSuggestion - lightness shift", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { lightnessShift: 0.1 });

    const expectedLightness = Math.min(1, original.accent.l + 0.1);
    assert.deepEqual(Math.abs(adjusted.accent.l - expectedLightness) < 0.001, true);
    assert.deepEqual(adjusted.accent.c, original.accent.c);
    assert.deepEqual(adjusted.accent.h, original.accent.h);
});

test("palette suggestions have correct structure", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    result.suggestions.forEach((suggestion) => {
        assert.exists(suggestion.name);
        assert.exists(suggestion.description);
        assert.exists(suggestion.accent);
        assert.exists(suggestion.primaries);
        assert.exists(suggestion.harmony);

        assert.deepEqual(typeof suggestion.primaries.hue, "number");
        assert.deepEqual(Array.isArray(suggestion.primaries.chromaRange), true);
        assert.deepEqual(suggestion.primaries.chromaRange.length, 2);

        assert.deepEqual(
            ["complementary", "analogous", "triadic"].includes(suggestion.harmony.type),
            true,
        );
        assert.deepEqual(Array.isArray(suggestion.harmony.colors), true);
    });
});

test("palette suggestions - vibrant accent has low chroma range", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const vibrantSuggestion = result.suggestions.find((s) => s.name === "Vibrant Accent");
    assert.exists(vibrantSuggestion);

    const [minChroma, maxChroma] = vibrantSuggestion.primaries.chromaRange;
    assert.deepEqual(minChroma >= 0.01 && minChroma <= 0.02, true);
    assert.deepEqual(maxChroma >= 0.05 && maxChroma <= 0.06, true);
});

test("palette suggestions - analogous harmony has medium chroma range", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const analogousSuggestion = result.suggestions.find((s) => s.name === "Analogous Harmony");
    assert.exists(analogousSuggestion);

    const [minChroma, maxChroma] = analogousSuggestion.primaries.chromaRange;
    assert.deepEqual(minChroma === 0.02, true);
    assert.deepEqual(maxChroma === 0.06, true);
});
