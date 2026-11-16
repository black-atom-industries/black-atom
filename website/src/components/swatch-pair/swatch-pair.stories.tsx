import preview from "#/storybook/preview.tsx";
import { SwatchPair } from "./swatch-pair.tsx";

const meta = preview.meta({
    title: "Components/SwatchPair",
    component: SwatchPair,
    args: {
        first: { label: "dark red", color: "#b5475a" },
        second: { label: "red", color: "#e0707f" },
    },
});

export const Default = meta.story();
