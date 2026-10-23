import preview from "#/storybook/preview.tsx";
import { BrandMark } from "#/components/brand-mark/index.ts";
import { HeaderBar } from "./header-bar.tsx";

const meta = preview.meta({
    title: "Components/HeaderBar",
    component: HeaderBar,
    parameters: {
        layout: "fullscreen",
        // Fixed positioning needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "200px" } },
    },
    args: {
        children: <BrandMark href="#home" title="Black Atom" subtitle="Industries" />,
    },
});

export const Default = meta.story();
