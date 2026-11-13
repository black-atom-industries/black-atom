import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { DiffPreview } from "./diff-preview.tsx";

const theme = themeCatalog["black-atom-jpn-murasaki-dark"];

const meta = preview.meta({
    title: "Components/DiffPreview",
    component: DiffPreview,
    args: { theme },
    // Specimen text uses the theme's own palette; axe still checks the page chrome.
    parameters: {
        a11y: {
            config: { rules: [{ id: "color-contrast", enabled: false }] },
        },
    },
});

export const Dark = meta.story();

export const Light = meta.story({
    args: { theme: themeCatalog["black-atom-jpn-murasaki-light"] },
});

export const Before = meta.story({
    args: { borderColor: theme.ui.fg.subtle, label: "Before · HEAD" },
});
