import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { ThemePreview } from "./theme-preview.tsx";

const theme = themeCatalog["black-atom-default-dark"];

const meta = preview.meta({
    title: "Components/ThemePreview",
    component: ThemePreview,
    args: {
        shortKey: "default-dark",
        name: theme.meta.name,
        palette: Object.values(theme.palette),
    },
});

export const Default = meta.story();
