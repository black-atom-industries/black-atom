import preview from "#/storybook/preview.tsx";
import { Heading } from "./heading.tsx";

const meta = preview.meta({
    title: "Components/Heading",
    component: Heading,
    args: { children: "The loop" },
});

export const Display = meta.story({
    args: { variant: "display", children: "Black Atom", subtitle: "Industries" },
});

export const DisplaySmall = meta.story({ args: { variant: "display-sm", children: "iter.nvim" } });

export const Section = meta.story({ args: { variant: "section" } });

export const Title = meta.story({
    args: { variant: "title", children: "Every change, one keystroke away" },
});

export const Item = meta.story({ args: { variant: "item", children: "See what changed" } });
