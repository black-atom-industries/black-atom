import type * as Theme from "@black-atom/core";
import { ColorRow } from "#/components/color-row/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { TokenCard } from "#/components/token-card/index.ts";
import { uiTokenPurpose } from "#/content/theme-tokens.ts";
import { contrastRatio } from "#/lib/contrast-ratio.ts";

type Props = { theme: Theme.Definition };

const purposeOfBg: Readonly<Record<string, string>> = uiTokenPurpose.bg;

/** Every UI background as a swatch with its name, value and purpose. */
export function UiBackgroundTokens({ theme }: Props) {
    return (
        <PageGrid columns="three" align="start">
            {Object.entries(theme.ui.bg).map(([key, color]) => (
                <TokenCard key={key} name={`bg.${key}`} color={color} purpose={purposeOfBg[key]} />
            ))}
        </PageGrid>
    );
}

/** Every UI foreground, each drawn on the background it is read on and graded there. */
export function UiForegroundTokens({ theme }: Props) {
    const rows = [
        ...(["default", "subtle", "accent", "disabled"] as const).map((key) => ({
            key,
            on: theme.ui.bg.default,
        })),
        { key: "contrast", on: theme.ui.bg.contrast },
        ...(
            ["negative", "warn", "info", "hint", "positive", "add", "delete", "modify"] as const
        ).map((key) => ({ key, on: theme.ui.bg[key] })),
        { key: "border", on: theme.ui.bg.default },
    ] as const;

    return (
        <PageGrid columns="three" align="start">
            {rows.map(({ key, on }) => (
                <TokenCard
                    key={key}
                    name={`fg.${key}`}
                    color={theme.ui.fg[key]}
                    on={on}
                    purpose={uiTokenPurpose.fg[key]}
                    ratio={contrastRatio(theme.ui.fg[key], on)}
                    isLine={key === "border"}
                />
            ))}
        </PageGrid>
    );
}

/** Every syntax group's default color, read on the default background. */
export function SyntaxTokens({ theme }: Props) {
    const groups = Object.entries(theme.syntax).flatMap(([name, colors]) =>
        "default" in colors ? [{ name, color: colors.default }] : [],
    );

    return (
        <PageGrid columns="three" align="start">
            {groups.map(({ name, color }) => (
                <ColorRow
                    key={name}
                    name={name}
                    color={color}
                    on={theme.ui.bg.default}
                    ratio={contrastRatio(color, theme.ui.bg.default)}
                />
            ))}
        </PageGrid>
    );
}

/** Every palette slot, the colors a terminal draws its text in, read on the default background. */
export function TerminalTokens({ theme }: Props) {
    return (
        <PageGrid columns="three" align="start">
            {Object.entries(theme.palette).map(([name, color]) => (
                <ColorRow
                    key={name}
                    name={name}
                    color={color}
                    on={theme.ui.bg.default}
                    ratio={contrastRatio(color, theme.ui.bg.default)}
                />
            ))}
        </PageGrid>
    );
}
