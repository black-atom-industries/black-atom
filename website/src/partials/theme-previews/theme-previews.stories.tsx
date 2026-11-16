import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { ThemePreviews } from "./theme-previews.tsx";

const theme = themeCatalog["black-atom-jpn-murasaki-dark"];
const before = themeCatalog["black-atom-jpn-koyo-dark"];

const meta = preview.meta({
    title: "Partials/ThemePreviews",
    component: ThemePreviews,
    args: { theme },
    // Preview text uses each theme's own palette; axe still checks the page chrome around it.
    parameters: {
        a11y: {
            config: { rules: [{ id: "color-contrast", enabled: false }] },
        },
    },
});

export const Default = meta.story();

export const WithBefore = meta.story({ args: { before } });
