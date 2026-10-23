import { collectionOrder, DEFAULT_THEME_KEY, themeCatalog } from "@black-atom/core";
import { definePreview } from "@storybook/react-vite";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { themeDecorator } from "./decorators/theme-decorator.tsx";
import "#/styles/global.css";

const themeItems = collectionOrder.flatMap((collectionKey) =>
    Object.values(themeCatalog)
        .filter((theme) => theme.meta.collection.key === collectionKey)
        .map((theme) => ({
            value: theme.meta.key,
            title: theme.meta.name,
            right: theme.meta.collection.label,
        })),
);

export default definePreview({
    addons: [addonDocs(), addonA11y()],
    tags: ["autodocs"],
    globalTypes: {
        theme: {
            name: "Theme",
            toolbar: {
                icon: "paintbrush",
                items: themeItems,
                title: "Theme",
                dynamicTitle: true,
            },
        },
    },
    initialGlobals: {
        theme: DEFAULT_THEME_KEY,
    },
    parameters: {
        layout: "padded",
        controls: { expanded: true },
        a11y: { test: "error" },
    },
    decorators: [themeDecorator],
});
