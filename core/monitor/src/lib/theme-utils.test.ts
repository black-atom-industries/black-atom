import { assert, test } from "vitest";
import { groupByCollection } from "./theme-utils.ts";
import type * as Theme from "@core/types/theme.ts";
import { themeCatalog } from "@core/themes/catalog.ts";

test("Monitor groups all 32 current themes into seven collections", () => {
    const groups = groupByCollection(Object.values(themeCatalog));
    assert.deepEqual(
        [...groups].map(([key, themes]) => [key, themes.length]),
        [
            ["default", 4],
            ["facility", 4],
            ["terra", 8],
            ["jpn", 6],
            ["clay", 2],
            ["minium", 4],
            ["mono", 4],
        ],
    );
    assert.deepEqual([...groups.values()].flat().length, 32);
});

const makeTheme = (key: string, collection: string) =>
    ({
        meta: {
            key,
            name: key,
            appearance: "dark",
            status: "release",
            collection: { key: collection, label: collection },
        },
    }) as unknown as Theme.Definition;

test("groupByCollection groups themes by collection key", () => {
    const themes = [makeTheme("a", "default"), makeTheme("b", "jpn"), makeTheme("c", "default")];
    const result = groupByCollection(themes);
    assert.deepEqual(result.size, 2);
    assert.deepEqual(result.get("default")?.length, 2);
    assert.deepEqual(result.get("jpn")?.length, 1);
});

test("groupByCollection preserves insertion order", () => {
    const themes = [makeTheme("a", "jpn"), makeTheme("b", "default")];
    const keys = Array.from(groupByCollection(themes).keys());
    assert.deepEqual(keys[0], "jpn");
    assert.deepEqual(keys[1], "default");
});

test("groupByCollection returns empty map for empty input", () => {
    assert.deepEqual(groupByCollection([]).size, 0);
});
