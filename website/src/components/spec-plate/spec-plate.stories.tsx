import preview from "#/storybook/preview.tsx";
import { SpecPlate } from "./spec-plate.tsx";

const meta = preview.meta({
    title: "Components/SpecPlate",
    component: SpecPlate,
});

export const Default = meta.story({
    args: {
        strip: ["#1d1b26", "#2b2740", "#8a6fd1", "#d65f5f", "#5fb37a", "#e0b04a"],
        cells: [
            { label: "Collection", value: "Jpn", note: "Murasaki family" },
            { label: "Appearance", value: "Dark", note: "Low chroma" },
            { label: "Contrast", value: "AA", note: "4.5:1 on text", tone: "good" },
            { label: "Status", value: "Ready", note: "Released", tone: "accent" },
        ],
        keyLine:
            "black-atom-jpn-murasaki-dark · black-atom.industries/black-atom/themes/murasaki-dark",
    },
});
