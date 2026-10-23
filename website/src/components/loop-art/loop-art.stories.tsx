import preview from "#/storybook/preview.tsx";
import { LoopArt } from "./loop-art.tsx";

const meta = preview.meta({
    title: "Art/LoopArt",
    component: LoopArt,
    args: { stations: ["Read", "Stage", "Annotate", "Hand back"] as const },
});

export const Default = meta.story();
