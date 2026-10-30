import preview from "#/storybook/preview.tsx";
import { ContrastScore } from "./contrast-score.tsx";

const meta = preview.meta({
    title: "Components/ContrastScore",
    component: ContrastScore,
    args: { score: 0.89, below: 6, total: 57, ratio: 3 },
});

export const Default = meta.story();

export const Good = meta.story({ args: { score: 0.98, below: 1 } });

export const Poor = meta.story({ args: { score: 0.75, below: 14 } });

export const WithPrevious = meta.story({ args: { previous: { score: 0.84, below: 9 } } });
