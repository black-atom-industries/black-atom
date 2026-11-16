import type { ComponentProps, ReactElement } from "react";
import type * as Theme from "@black-atom/core";
import { AppearanceSwitch } from "#/components/appearance-switch/index.ts";
import { Button } from "#/components/button/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Swatch } from "#/components/swatch/index.ts";

export type ThemeChip = {
    key: string;
    label: string;
    /** The theme the chip opens, whose colors it shows. */
    theme: Theme.Definition;
    isActive: boolean;
    /** The link to the theme, such as `<a href="…" />`. */
    render: ReactElement;
};

type Props = {
    collections: readonly ThemeChip[];
    families: readonly ThemeChip[];
    appearances: ComponentProps<typeof AppearanceSwitch>["options"];
};

function Chips({ chips }: { chips: readonly ThemeChip[] }) {
    return (
        <Stack direction="row" gap="xs" isWrapped>
            {chips.map((chip) => (
                <Button
                    key={chip.key}
                    variant="chip"
                    isActive={chip.isActive}
                    aria-current={chip.isActive ? "true" : undefined}
                    render={chip.render}
                >
                    <Stack direction="row" gap="2xs" align="center" render={<span />}>
                        <Swatch size="dot" color={chip.theme.ui.bg.default} />
                        <Swatch size="dot" color={chip.theme.ui.fg.border} />
                        <Swatch size="dot" color={chip.theme.ui.fg.default} />
                        <Swatch size="dot" color={chip.theme.accents.a10} />
                    </Stack>
                    {chip.label}
                </Button>
            ))}
        </Stack>
    );
}

/** Picks a theme by collection, family and appearance. Each chip shows four colors of its theme. */
export function ThemePicker({ collections, families, appearances }: Props) {
    return (
        <Stack gap="sm" isDivided render={<nav aria-label="Themes" />}>
            <Chips chips={collections} />
            <Chips chips={families} />
            <AppearanceSwitch label="Appearance" options={appearances} />
        </Stack>
    );
}
