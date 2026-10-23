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

export const Name = meta.story({ args: { variant: "name", children: "Koyo Dark" } });

export const NameWithKicker = meta.story({
    args: { variant: "name", kicker: "JPN · dark", children: "Koyo Dark" },
});

export const Section = meta.story({ args: { variant: "section" } });

export const Product = meta.story({ args: { variant: "product", children: "iter.nvim" } });

export const Title = meta.story({
    args: { variant: "title", children: "Every change, one keystroke away" },
});

export const Item = meta.story({ args: { variant: "item", children: "See what changed" } });
