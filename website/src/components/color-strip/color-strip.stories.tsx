import preview from "#/storybook/preview.tsx";
import { ColorStrip } from "./color-strip.tsx";

const meta = preview.meta({
    title: "Components/ColorStrip",
    component: ColorStrip,
    args: {
        colors: [
            "var(--ba-bg-panel)",
            "var(--ba-bg)",
            "var(--ba-bg-active)",
            "var(--ba-bg-selection)",
            "var(--ba-fg-disabled)",
            "var(--ba-fg-subtle)",
            "var(--ba-fg)",
            "var(--ba-accent)",
        ],
    },
});

export const Ramp = meta.story();

export const Small = meta.story({ args: { height: "sm" } });
