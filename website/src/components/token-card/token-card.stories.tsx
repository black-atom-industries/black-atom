import { ColorSources } from "#/hooks/use-color-source.ts";
import preview from "#/storybook/preview.tsx";
import { TokenCard } from "./token-card.tsx";

const meta = preview.meta({
    title: "Components/TokenCard",
    component: TokenCard,
    args: {
        name: "bg.default",
        color: "#1d1b26",
        purpose: "Editor background",
    },
    decorators: [
        (Story) => (
            <ColorSources
                value={{
                    "ui.fg.default": { ref: "primaries.d20" },
                    "ui.bg.negative": { from: ["primaries.l30", "feedback.negative"] },
                }}
            >
                <Story />
            </ColorSources>
        ),
    ],
});

export const Background = meta.story();

export const Text = meta.story({
    args: {
        name: "fg.default",
        color: "#e4dfd6",
        on: "#1d1b26",
        purpose: "Body text in the editor",
        path: "ui.fg.default",
        ratio: 12.4,
    },
});

export const Derived = meta.story({
    args: {
        name: "bg.negative",
        color: "#f3d6e3",
        purpose: "Errors",
        path: "ui.bg.negative",
    },
});

export const Line = meta.story({
    args: {
        name: "fg.border",
        color: "#3a3644",
        on: "#1d1b26",
        purpose: "Window borders and indent guides",
        ratio: 1.8,
        isLine: true,
    },
});
