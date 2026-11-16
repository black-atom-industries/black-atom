import preview from "#/storybook/preview.tsx";
import { BrandMark } from "./brand-mark.tsx";

const meta = preview.meta({
    title: "Components/BrandMark",
    component: BrandMark,
    args: {
        href: "#home",
        title: "Black Atom",
        subtitle: "Industries",
    },
});

export const Default = meta.story();
