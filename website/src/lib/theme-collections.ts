import { collectionOrder, themeCatalog } from "@black-atom/core";

/** Every catalog collection in display order, with its themes. */
export const themeCollections = collectionOrder.map((collectionKey) => {
    const themes = Object.values(themeCatalog).filter(
        (theme) => theme.meta.collection.key === collectionKey,
    );
    return { key: collectionKey, label: themes[0].meta.collection.label, themes };
});
