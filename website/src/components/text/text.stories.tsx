import preview from "#/storybook/preview.tsx";
import { Text } from "./text.tsx";

const meta = preview.meta({
    title: "Components/Text",
    component: Text,
    args: {
        children:
            "Whether the changes are yours or an agent's, iter is the review half of the loop.",
    },
});

export const Body = meta.story();

export const Lead = meta.story({ args: { variant: "lead", tone: "subtle" } });

export const Tagline = meta.story({
    args: { variant: "tagline", children: "Review, annotate, hand back, repeat." },
});

export const Small = meta.story({ args: { variant: "small", tone: "subtle" } });
