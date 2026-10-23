import preview from "#/storybook/preview.tsx";
import { Pill } from "./pill.tsx";

const meta = preview.meta({
    title: "Components/Pill",
    component: Pill,
    args: { children: "ghostty" },
});

export const Default = meta.story();

export const Active = meta.story({ args: { isActive: true, hasDot: true, children: "switches" } });
