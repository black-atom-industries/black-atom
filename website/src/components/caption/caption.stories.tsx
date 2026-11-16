import preview from "#/storybook/preview.tsx";
import { Caption } from "./caption.tsx";

const meta = preview.meta({
    title: "Components/Caption",
    component: Caption,
    args: { children: "Neovim plugin" },
});

export const Default = meta.story();

export const Subtle = meta.story({ args: { tone: "subtle" } });

export const Accent = meta.story({ args: { tone: "accent", children: "02" } });

export const Small = meta.story({ args: { tone: "subtle", size: "sm", children: "Appearance" } });
