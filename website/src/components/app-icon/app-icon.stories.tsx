import preview from "#/storybook/preview.tsx";
import { AppIcon } from "./app-icon.tsx";

const meta = preview.meta({
    title: "Components/AppIcon",
    component: AppIcon,
    args: { src: "/media/livery-icon.png", alt: "Livery" },
});

export const Default = meta.story();
