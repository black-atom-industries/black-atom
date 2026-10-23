import preview from "#/storybook/preview.tsx";
import { ColorStrip } from "#/components/color-strip/index.ts";
import { ArtFrame } from "./art-frame.tsx";

const meta = preview.meta({
    title: "Components/ArtFrame",
    component: ArtFrame,
    args: {
        label: "The active theme's palette",
        caption: "Black Atom — Dark",
        children: (
            <ColorStrip
                height="fill"
                colors={["var(--ba-c-red)", "var(--ba-c-yellow)", "var(--ba-c-green)"]}
            />
        ),
    },
});

export const Default = meta.story();
