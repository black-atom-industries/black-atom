import preview from "#/storybook/preview.tsx";
import { Breadcrumbs } from "./breadcrumbs.tsx";

const meta = preview.meta({
    title: "Components/Breadcrumbs",
    component: Breadcrumbs,
    args: {
        label: "Breadcrumbs",
        crumbs: [
            { label: "Black Atom", render: <a href="#black-atom" /> },
            { label: "Themes", render: <a href="#themes" /> },
            { label: "JPN" },
        ],
    },
});

export const Default = meta.story();
