import type * as Theme from "../types/theme.ts";

function createLabel(collection: { key: string; label: string }, name: string): string {
    if (collection.key === "default") {
        return `Black Atom — ${name}`;
    }

    return `Black Atom — ${collection.label} ∷ ${name}`;
}

export function defineCollection<
    const CollectionKey extends string,
    const Input extends Record<
        string,
        {
            meta: {
                name: string;
                appearance: "light" | "dark";
                status: "development" | "release";
            };
            colors: Theme.Colors;
        }
    >,
>(input: {
    meta: {
        key: CollectionKey;
        label: string;
        order: number;
    };
    themes: Input;
}): Theme.CollectionDefinition<
    CollectionKey,
    {
        [ThemeKey in keyof Input]: Theme.ThemeDefinition<ThemeKey & string, CollectionKey>;
    }
> {
    const themes = Object.fromEntries(
        Object.entries(input.themes).map(([key, theme]) => [
            key,
            {
                meta: {
                    ...theme.meta,
                    key,
                    label: createLabel(input.meta, theme.meta.name),
                    collection: input.meta,
                },
                ...theme.colors,
            },
        ]),
    ) as {
        [ThemeKey in keyof Input]: Theme.ThemeDefinition<ThemeKey & string, CollectionKey>;
    };

    return { meta: input.meta, themes };
}
