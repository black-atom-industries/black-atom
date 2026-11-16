import preview from "#/storybook/preview.tsx";
import { ContrastGrade } from "./contrast-grade.tsx";

const meta = preview.meta({
    title: "Components/ContrastGrade",
    component: ContrastGrade,
    args: { ratio: 8.2 },
});

export const AAA = meta.story();

export const AA = meta.story({ args: { ratio: 5.1 } });

export const Large = meta.story({ args: { ratio: 3.4 } });

export const Low = meta.story({ args: { ratio: 2.1 } });

export const Line = meta.story({ args: { ratio: 1.6, isLine: true } });
