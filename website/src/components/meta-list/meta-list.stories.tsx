import preview from "#/storybook/preview.tsx";
import { MetaList } from "./meta-list.tsx";

const meta = preview.meta({
    title: "Components/MetaList",
    component: MetaList,
    args: {
        items: [
            { label: "v0.5.0", isStrong: true },
            { label: "Neovim 0.12+" },
            { label: "git" },
            { label: "MIT" },
        ],
    },
});

export const Default = meta.story();
