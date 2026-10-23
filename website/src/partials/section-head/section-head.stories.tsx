import preview from "#/storybook/preview.tsx";
import { SectionHead } from "./section-head.tsx";

const meta = preview.meta({
    title: "Partials/SectionHead",
    component: SectionHead,
    args: { number: "03", title: "Themes", aside: "31 themes · 6 collections" },
});

export const Default = meta.story();

export const WithoutAside = meta.story({ args: { aside: undefined } });
