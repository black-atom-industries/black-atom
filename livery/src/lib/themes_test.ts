import { assert, test } from "vitest";
import { themeCatalog } from "@black-atom/core";
import { collectionOrder } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import { formatCollectionTitle, getGroupedThemes, pickRandomOtherTheme } from "./themes.ts";
import expectedCatalog from "../../core/tests/fixtures/catalog.json" with { type: "json" };

test("Livery exposes the exact embedded catalog metadata and all seven groups", () => {
    const actual = Object.values(themeCatalog)
        .map(({ meta }) => ({
            key: meta.key,
            collection_key: meta.collection.key,
            appearance: meta.appearance,
            label: meta.label,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
    assert.deepEqual(actual, expectedCatalog);
    assert.deepEqual(
        getGroupedThemes(themeCatalog).map((group) => group.collectionKey),
        ["default", "facility", "terra", "jpn", "clay", "minium", "mono"],
    );
});

test("formatCollectionTitle collapses a label that merely echoes the key", () => {
    assert.deepEqual(formatCollectionTitle("jpn", "JPN"), "JPN");
    assert.deepEqual(formatCollectionTitle("default", "Default"), "DEFAULT");
});

test("formatCollectionTitle keeps the em-dash form for distinct labels", () => {
    assert.deepEqual(formatCollectionTitle("jpn", "Japan"), "JPN — JAPAN");
});

test("getGroupedThemes returns populated groups in collectionOrder", () => {
    const groups = getGroupedThemes(themeCatalog);
    const keys = groups.map((group) => group.collectionKey);
    const populatedKeys = new Set<Theme.CollectionKey>(
        Object.values(themeCatalog).map((theme) => theme.meta.collection.key),
    );

    assert.deepEqual(
        keys,
        collectionOrder.filter((collectionKey) => populatedKeys.has(collectionKey)),
    );
});

test("getGroupedThemes sorts themes within each group alphabetically", () => {
    const groups = getGroupedThemes(themeCatalog);
    groups.forEach((group) => {
        const names = group.themes.map((t) => t.meta.name);
        const sorted = [...names].sort((a, b) => a.localeCompare(b));
        assert.deepEqual(names, sorted);
    });
});

test("getGroupedThemes uses collection label from theme meta", () => {
    const groups = getGroupedThemes(themeCatalog);
    groups.forEach((group) => {
        assert.deepEqual(group.label, group.themes[0].meta.collection.label);
    });
});

test("getGroupedThemes includes all themes from themeCatalog", () => {
    const grouped = getGroupedThemes(themeCatalog);
    const flatCount = grouped.reduce((sum, g) => sum + g.themes.length, 0);
    const totalThemes = Object.values(themeCatalog).filter(Boolean).length;
    assert.isAbove(flatCount, 0);
    assert.deepEqual(flatCount, totalThemes);
});

test("pickRandomOtherTheme never returns the current theme", () => {
    const currentKey = "black-atom-default-dark";
    for (let i = 0; i < 20; i++) {
        const picked = pickRandomOtherTheme(themeCatalog, currentKey, () => i / 20);
        assert.notDeepEqual(picked?.meta.key, currentKey);
    }
});

test("pickRandomOtherTheme is deterministic given a fixed random source", () => {
    const currentKey = "black-atom-default-dark";
    const first = pickRandomOtherTheme(themeCatalog, currentKey, () => 0);
    const second = pickRandomOtherTheme(themeCatalog, currentKey, () => 0);
    assert.deepEqual(first?.meta.key, second?.meta.key);
});
