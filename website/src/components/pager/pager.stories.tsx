import preview from "#/storybook/preview.tsx";
import { Pager } from "./pager.tsx";

const meta = preview.meta({
    title: "Components/Pager",
    component: Pager,
    args: {
        label: "More pages",
        previous: { label: "← Back", title: "Livery", render: <a href="#livery" /> },
        next: { label: "Next →", title: "radar.nvim", render: <a href="#radar" /> },
    },
});

export const Default = meta.story();
