import { assertEquals, assertGreater, assertNotEquals } from "@std/assert";
import { themeMap } from "@black-atom/core";
import { collectionOrder } from "@black-atom/core";
import { formatCollectionTitle, getGroupedThemes, pickRandomOtherTheme } from "./themes.ts";

Deno.test("formatCollectionTitle collapses a label that merely echoes the key", () => {
    assertEquals(formatCollectionTitle("jpn", "JPN"), "JPN");
    assertEquals(formatCollectionTitle("default", "Default"), "DEFAULT");
});

Deno.test("formatCollectionTitle keeps the em-dash form for distinct labels", () => {
    assertEquals(formatCollectionTitle("jpn", "Japan"), "JPN — JAPAN");
});

Deno.test("getGroupedThemes returns groups in collectionOrder", () => {
    const groups = getGroupedThemes(themeMap);
    const keys = groups.map((g) => g.collectionKey);
    assertEquals(keys, collectionOrder);
});

Deno.test("getGroupedThemes sorts themes within each group alphabetically", () => {
    const groups = getGroupedThemes(themeMap);
    groups.forEach((group) => {
        const names = group.themes.map((t) => t.meta.name);
        const sorted = [...names].sort((a, b) => a.localeCompare(b));
        assertEquals(names, sorted);
    });
});

Deno.test("getGroupedThemes uses collection label from theme meta", () => {
    const groups = getGroupedThemes(themeMap);
    groups.forEach((group) => {
        assertEquals(group.label, group.themes[0].meta.collection.label);
    });
});

Deno.test("getGroupedThemes includes all themes from themeMap", () => {
    const grouped = getGroupedThemes(themeMap);
    const flatCount = grouped.reduce((sum, g) => sum + g.themes.length, 0);
    const totalThemes = Object.values(themeMap).filter(Boolean).length;
    assertGreater(flatCount, 0);
    assertEquals(flatCount, totalThemes);
});

Deno.test("pickRandomOtherTheme never returns the current theme", () => {
    const currentKey = "black-atom-default-dark";
    for (let i = 0; i < 20; i++) {
        const picked = pickRandomOtherTheme(themeMap, currentKey, () => i / 20);
        assertNotEquals(picked?.meta.key, currentKey);
    }
});

Deno.test("pickRandomOtherTheme is deterministic given a fixed random source", () => {
    const currentKey = "black-atom-default-dark";
    const first = pickRandomOtherTheme(themeMap, currentKey, () => 0);
    const second = pickRandomOtherTheme(themeMap, currentKey, () => 0);
    assertEquals(first?.meta.key, second?.meta.key);
});
