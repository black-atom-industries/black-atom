import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import {
    SyntaxTokens,
    TerminalTokens,
    UiBackgroundTokens,
    UiForegroundTokens,
} from "./theme-tokens.tsx";

const meta = preview.meta({
    title: "Partials/UiBackgroundTokens",
    component: UiBackgroundTokens,
    args: { theme: themeCatalog["black-atom-jpn-murasaki-dark"] },
    // Syntax and terminal samples are drawn in their own colors, so the text check would fail by design.
    parameters: {
        a11y: {
            config: { rules: [{ id: "color-contrast", enabled: false }] },
        },
    },
});

export const UiBackgrounds = meta.story();

export const UiForegrounds = meta.story({
    render: (args) => <UiForegroundTokens theme={args.theme} />,
});

export const Syntax = meta.story({
    render: (args) => <SyntaxTokens theme={args.theme} />,
});

export const Terminal = meta.story({
    render: (args) => <TerminalTokens theme={args.theme} />,
});
