import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { join } from "@std/path";
import {
    adjustPaletteSuggestion,
    extractPaletteFromImage,
    generatePrimariesFromSuggestion,
} from "./palette-from-image.ts";

async function hasMagick(): Promise<boolean> {
    try {
        const { success } = await new Deno.Command("magick", {
            args: ["-version"],
            stdout: "null",
            stderr: "null",
        }).output();
        return success;
    } catch {
        return false;
    }
}

const test = (await hasMagick()) ? Deno.test : Deno.test.ignore;

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

    assertEquals(result.dominantColors.length, 10);
    assertExists(result.suggestions);
    assertEquals(result.suggestions.length, 3);

    result.dominantColors.forEach((color) => {
        assertEquals(typeof color.hex, "string");
        assertEquals(color.oklch.l >= 0 && color.oklch.l <= 1, true);
        assertEquals(color.oklch.c >= 0, true);
        assertEquals(color.oklch.h >= 0 && color.oklch.h < 360, true);
        assertEquals(color.percentage > 0, true);
    });

    assertExists(result.metadata);
    assertEquals(typeof result.metadata.avgLightness, "number");
    assertEquals(typeof result.metadata.avgChroma, "number");
    assertEquals(
        ["dark", "light", "both"].includes(result.metadata.suggestedAppearance),
        true,
    );
});

Deno.test("extractPaletteFromImage - image not found", async () => {
    await assertRejects(
        async () => {
            await extractPaletteFromImage({
                imagePath: "./non-existent-image.jpg",
            });
        },
        Error,
        "Image not found",
    );
});

test("generatePrimariesFromSuggestion - dark theme", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const suggestion = result.suggestions[0];
    const code = generatePrimariesFromSuggestion(suggestion, "dark");

    assertEquals(code.includes("const primaries: ThemePrimaryColors"), true);
    assertEquals(code.includes("d10:"), true);
    assertEquals(code.includes("d20:"), true);
    assertEquals(code.includes("d30:"), true);
    assertEquals(code.includes("d40:"), true);
    assertEquals(code.includes("m10:"), true);
    assertEquals(code.includes("m20:"), true);
    assertEquals(code.includes("m30:"), true);
    assertEquals(code.includes("m40:"), true);
    assertEquals(code.includes("l10:"), true);
    assertEquals(code.includes("l20:"), true);
    assertEquals(code.includes("l30:"), true);
    assertEquals(code.includes("l40:"), true);
    assertEquals(code.includes("oklch("), true);
});

test("generatePrimariesFromSuggestion - light theme", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const suggestion = result.suggestions[0];
    const code = generatePrimariesFromSuggestion(suggestion, "light");

    assertEquals(code.includes("const primaries: ThemePrimaryColors"), true);

    const lightnessValues = code.match(/oklch\(([0-9.]+),/g);
    assertExists(lightnessValues);
    assertEquals(lightnessValues.length, 12);
});

test("adjustPaletteSuggestion - hue shift", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { hueShift: 15 });

    const expectedHue = (original.accent.h + 15) % 360;
    assertEquals(Math.abs(adjusted.accent.h - expectedHue) < 0.01, true);
    assertEquals(adjusted.accent.l, original.accent.l);
    assertEquals(adjusted.accent.c, original.accent.c);
});

test("adjustPaletteSuggestion - chroma multiplier", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { chromaMultiplier: 1.5 });

    assertEquals(Math.abs(adjusted.accent.c - original.accent.c * 1.5) < 0.001, true);
    assertEquals(adjusted.accent.l, original.accent.l);
    assertEquals(adjusted.accent.h, original.accent.h);
});

test("adjustPaletteSuggestion - lightness shift", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const original = result.suggestions[0];
    const adjusted = adjustPaletteSuggestion(original, { lightnessShift: 0.1 });

    const expectedLightness = Math.min(1, original.accent.l + 0.1);
    assertEquals(Math.abs(adjusted.accent.l - expectedLightness) < 0.001, true);
    assertEquals(adjusted.accent.c, original.accent.c);
    assertEquals(adjusted.accent.h, original.accent.h);
});

test("palette suggestions have correct structure", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    result.suggestions.forEach((suggestion) => {
        assertExists(suggestion.name);
        assertExists(suggestion.description);
        assertExists(suggestion.accent);
        assertExists(suggestion.primaries);
        assertExists(suggestion.harmony);

        assertEquals(typeof suggestion.primaries.hue, "number");
        assertEquals(Array.isArray(suggestion.primaries.chromaRange), true);
        assertEquals(suggestion.primaries.chromaRange.length, 2);

        assertEquals(
            ["complementary", "analogous", "triadic"].includes(suggestion.harmony.type),
            true,
        );
        assertEquals(Array.isArray(suggestion.harmony.colors), true);
    });
});

test("palette suggestions - vibrant accent has low chroma range", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const vibrantSuggestion = result.suggestions.find((s) => s.name === "Vibrant Accent");
    assertExists(vibrantSuggestion);

    const [minChroma, maxChroma] = vibrantSuggestion.primaries.chromaRange;
    assertEquals(minChroma >= 0.01 && minChroma <= 0.02, true);
    assertEquals(maxChroma >= 0.05 && maxChroma <= 0.06, true);
});

test("palette suggestions - analogous harmony has medium chroma range", async () => {
    const result = await extractPaletteFromImage({
        imagePath: testImagePath,
    });

    const analogousSuggestion = result.suggestions.find((s) => s.name === "Analogous Harmony");
    assertExists(analogousSuggestion);

    const [minChroma, maxChroma] = analogousSuggestion.primaries.chromaRange;
    assertEquals(minChroma === 0.02, true);
    assertEquals(maxChroma === 0.06, true);
});
