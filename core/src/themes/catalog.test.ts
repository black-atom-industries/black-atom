import { assert, test } from "vitest";
import type * as Theme from "../types/theme.ts";
import defaultCollection from "./default/mod.ts";
import { collectionOrder, themeCatalog } from "./catalog.ts";

test("collection modules expose metadata and finished themes", () => {
    const theme = defaultCollection.themes["black-atom-default-dark"];

    assert.deepEqual(defaultCollection.meta.key, "default");
    assert.deepEqual(theme.meta.name, "Dark");
    assert.deepEqual(theme.meta.collection.key, "default");
    assert.exists(theme.ui.bg.default);
});

test("themeCatalog entries contain metadata and finished colors", () => {
    const theme = themeCatalog["black-atom-default-dark"];

    assert.deepEqual(theme.meta.key, "black-atom-default-dark");
    assert.deepEqual(theme.meta.label, "Black Atom — Dark");
    assert.exists(theme.ui.bg.default);
    assert.exists(theme.syntax.keyword.default);
});

test("collectionOrder follows collection metadata", () => {
    assert.deepEqual(collectionOrder, [
        "default",
        "facility",
        "terra",
        "jpn",
        "clay",
        "minium",
        "mono",
    ]);
});

type DefaultThemeKey = Theme.KeysForCollection<"default">;

function acceptDefaultThemeKey(_: DefaultThemeKey) {}

acceptDefaultThemeKey("black-atom-default-dark");

// @ts-expect-error JPN themes do not belong to the default collection.
acceptDefaultThemeKey("black-atom-jpn-koyo-dark");

const defaultThemeKey = "black-atom-default-dark" satisfies keyof typeof defaultCollection.themes;
assert.deepEqual(defaultThemeKey, "black-atom-default-dark");
