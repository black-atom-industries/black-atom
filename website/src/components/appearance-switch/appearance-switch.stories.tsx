import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { AppearanceSwitch } from "./appearance-switch.tsx";

const meta = preview.meta({
    title: "Components/AppearanceSwitch",
    component: AppearanceSwitch,
    args: {
        label: "Appearance",
        options: [
            {
                label: "Dark",
                isActive: true,
                theme: themeCatalog["black-atom-jpn-murasaki-dark"],
                render: <a href="#dark" />,
            },
            {
                label: "Light",
                isActive: false,
                theme: themeCatalog["black-atom-jpn-murasaki-light"],
                render: <a href="#light" />,
            },
            { label: "Dimmed", isActive: false },
        ],
    },
});

export const Default = meta.story();
