import preview from "#/storybook/preview.tsx";
import { RadarArt } from "./radar-art.tsx";

const meta = preview.meta({
    title: "Art/RadarArt",
    component: RadarArt,
    args: { keyGroups: [["a", "s", "d", "f", "g"], ["1", "2", "3"], ["o"]] },
});

export const Default = meta.story();
