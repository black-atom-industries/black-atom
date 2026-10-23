import preview from "#/storybook/preview.tsx";
import { Choice } from "./choice.tsx";

const meta = preview.meta({
    title: "Components/Choice",
    component: Choice,
    args: { children: "Koyo Dark", isSelected: false },
});

export const Default = meta.story();

export const Selected = meta.story({ args: { isSelected: true } });
