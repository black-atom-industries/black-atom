import { useId } from "react";
import { collectionOrder, DEFAULT_THEME_KEY, themeCatalog } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Choice } from "#/components/choice/index.ts";
import { CodeBlock } from "#/components/code-block/index.ts";
import { PairToggle } from "#/components/pair-toggle/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { siblingThemeKey, stepThemeKey, toShortKey } from "#/lib/theme-precedence.ts";

const siteHost = "black-atom.industries";

const collections = collectionOrder.map((collectionKey) => {
    const themes = Object.values(themeCatalog).filter(
        (theme) => theme.meta.collection.key === collectionKey,
    );
    return { key: collectionKey, label: themes[0].meta.collection.label, themes };
});

type Props = {
    themeKey: Theme.Key;
    onSelect: (key: Theme.Key) => void;
    /** Path of the current page, for the share URL. */
    sharePath: string;
};

export function ThemePanel({ themeKey, onSelect, sharePath }: Props) {
    const appearanceId = useId();
    const appearanceToggleId = useId();
    const theme = themeCatalog[themeKey];
    const sibling = siblingThemeKey(themeKey);
    const shareQuery = themeKey === DEFAULT_THEME_KEY ? "" : `?theme=${toShortKey(themeKey)}`;

    return (
        <Stack gap="lg" data-partial="ThemePanel">
            <Stack direction="row" justify="between" align="center">
                <Caption tone="accent">{theme.meta.label}</Caption>
                <Stack direction="row" gap="xs">
                    <Button
                        variant="square"
                        aria-label="Previous theme"
                        onClick={() => onSelect(stepThemeKey(themeKey, -1))}
                    >
                        ‹
                    </Button>
                    <Button
                        variant="square"
                        aria-label="Next theme"
                        onClick={() => onSelect(stepThemeKey(themeKey, 1))}
                    >
                        ›
                    </Button>
                </Stack>
            </Stack>
            <Stack direction="row" justify="between" align="center">
                <Caption id={appearanceId} tone="subtle" size="sm">
                    Appearance
                </Caption>
                <PairToggle
                    first="dark"
                    second="light"
                    active={theme.meta.appearance === "dark" ? "first" : "second"}
                    id={appearanceToggleId}
                    aria-labelledby={`${appearanceId} ${appearanceToggleId}`}
                    disabled={sibling === undefined}
                    onClick={() => sibling && onSelect(sibling)}
                />
            </Stack>
            <Stack gap="md" isDivided>
                {collections.map((collection) => (
                    <Stack key={collection.key} gap="2xs">
                        <Caption tone="subtle" size="sm">
                            {collection.label}
                        </Caption>
                        <Stack direction="row" gap="md" isWrapped>
                            {collection.themes.map((entry) => (
                                <Choice
                                    key={entry.meta.key}
                                    isSelected={entry.meta.key === themeKey}
                                    onClick={() => onSelect(entry.meta.key)}
                                >
                                    {entry.meta.name}
                                </Choice>
                            ))}
                        </Stack>
                    </Stack>
                ))}
            </Stack>
            <Stack gap="md" isDivided>
                <Caption tone="subtle" size="sm">
                    This page in this theme
                </Caption>
                <CodeBlock lines={[{ text: `${siteHost}${sharePath}`, accent: shareQuery }]} />
            </Stack>
        </Stack>
    );
}
