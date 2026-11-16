import { collectionOrder, themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { Button } from "#/components/button/index.ts";
import { toShortKey } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { ThemeCard } from "./theme-card.tsx";

const koyo = themeCatalog["black-atom-jpn-koyo-dark"];

const meta = preview.meta({
    title: "Components/ThemeCard",
    component: ThemeCard,
    args: {
        name: koyo.meta.name,
        appearance: koyo.meta.appearance,
        shortKey: toShortKey(koyo.meta.key),
        vars: themeToCustomProperties(koyo),
        actions: (
            <>
                <Button variant="inline">Wear</Button>
                <Button variant="inline" isSubtle render={<a href="#docs" />}>
                    Docs
                </Button>
            </>
        ),
    },
    render: (args) => (
        <div style={{ width: 280 }}>
            <ThemeCard {...args} />
        </div>
    ),
});

export const Default = meta.story();

export const Worn = meta.story({ args: { isWorn: true } });

// Several catalog themes miss 4.5:1 for subtle, accent and syntax text on their own background.
// That is theme data in core, so this story skips the contrast rule only.
export const EveryTheme = meta.story({
    parameters: { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } },
    render: () => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 12,
            }}
        >
            {collectionOrder.flatMap((collection) =>
                Object.values(themeCatalog)
                    .filter((theme) => theme.meta.collection.key === collection)
                    .map((theme) => (
                        <ThemeCard
                            key={theme.meta.key}
                            name={theme.meta.name}
                            appearance={theme.meta.appearance}
                            shortKey={toShortKey(theme.meta.key)}
                            vars={themeToCustomProperties(theme)}
                            actions={
                                <>
                                    <Button variant="inline">Wear</Button>
                                    <Button variant="inline" isSubtle render={<a href="#docs" />}>
                                        Docs
                                    </Button>
                                </>
                            }
                        />
                    )),
            )}
        </div>
    ),
});
