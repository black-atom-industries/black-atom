import preview from "#/storybook/preview.tsx";
import { TextLink } from "./text-link.tsx";

const meta = preview.meta({
    title: "Components/TextLink",
    component: TextLink,
    args: { href: "#adapters", children: "Adapters ↗" },
});

export const Default = meta.story();
