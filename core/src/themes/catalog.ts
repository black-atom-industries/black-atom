import type * as Theme from "../types/theme.ts";

import defaultCollection from "./default/mod.ts";
import jpnCollection from "./jpn/mod.ts";
import miniumCollection from "./minium/mod.ts";
import monoCollection from "./mono/mod.ts";
import facilityCollection from "./facility/mod.ts";
import terraCollection from "./terra/mod.ts";

const collections = [
    defaultCollection,
    facilityCollection,
    terraCollection,
    jpnCollection,
    miniumCollection,
    monoCollection,
] as const;

type CatalogCollection = (typeof collections)[number];

type KeysOf<T> = T extends unknown ? keyof T : never;

export type CatalogCollectionKey = CatalogCollection["meta"]["key"];
export type CatalogThemeKey = KeysOf<CatalogCollection["themes"]>;
export type CatalogCollectionMeta = CatalogCollection["meta"];

type CollectionForKey<CollectionKey extends CatalogCollectionKey> = Extract<
    CatalogCollection,
    { meta: { key: CollectionKey } }
>;

export type CatalogThemeKeysForCollection<CollectionKey extends CatalogCollectionKey> =
    keyof CollectionForKey<CollectionKey>["themes"];

export const themeCatalog = {
    ...defaultCollection.themes,
    ...facilityCollection.themes,
    ...terraCollection.themes,
    ...jpnCollection.themes,
    ...miniumCollection.themes,
    ...monoCollection.themes,
} as const satisfies Record<CatalogThemeKey, Theme.ThemeDefinition>;

export const themeKeys = Object.keys(themeCatalog) as CatalogThemeKey[];
export const collectionKeys = collections.map(({ meta }) => meta.key);
export const DEFAULT_THEME_KEY = themeCatalog["black-atom-default-dark"].meta.key;

export const collectionOrder = [...collections]
    .sort((a, b) => a.meta.order - b.meta.order)
    .map(({ meta }) => meta.key);
