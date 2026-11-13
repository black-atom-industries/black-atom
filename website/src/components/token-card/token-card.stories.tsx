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
});

export const Background = meta.story();

export const Text = meta.story({
    args: {
        name: "fg.default",
        color: "#e4dfd6",
        on: "#1d1b26",
        purpose: "Body text in the editor",
        ratio: 12.4,
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
