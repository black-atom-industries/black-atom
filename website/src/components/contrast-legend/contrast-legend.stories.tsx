import preview from "#/storybook/preview.tsx";
import { ContrastLegend } from "./contrast-legend.tsx";

const meta = preview.meta({
    title: "Components/ContrastLegend",
    component: ContrastLegend,
});

export const Default = meta.story();
