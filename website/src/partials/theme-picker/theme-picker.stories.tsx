import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { ThemePicker } from "./theme-picker.tsx";

const koyo = themeCatalog["black-atom-jpn-koyo-dark"];
const koyoLight = themeCatalog["black-atom-jpn-koyo-light"];
const murasaki = themeCatalog["black-atom-jpn-murasaki-dark"];

const meta = preview.meta({
    title: "Partials/ThemePicker",
    component: ThemePicker,
    args: {
        collections: [
            { key: "jpn", label: "JPN", theme: koyo, isActive: true, render: <a href="#jpn" /> },
            {
                key: "other",
                label: "Other",
                theme: murasaki,
                isActive: false,
                render: <a href="#other" />,
            },
        ],
        families: [
            { key: "koyo", label: "Koyo", theme: koyo, isActive: true, render: <a href="#koyo" /> },
            {
                key: "murasaki",
                label: "Murasaki",
                theme: murasaki,
                isActive: false,
                render: <a href="#murasaki" />,
            },
        ],
        appearances: [
            { label: "dark", isActive: true, theme: koyo, render: <a href="#dark" /> },
            { label: "light", isActive: false, theme: koyoLight, render: <a href="#light" /> },
        ],
    },
});

export const Default = meta.story();

export const WithoutLightVariant = meta.story({
    args: {
        appearances: [
            { label: "dark", isActive: true, theme: koyo, render: <a href="#dark" /> },
            { label: "light", isActive: false },
        ],
    },
});
