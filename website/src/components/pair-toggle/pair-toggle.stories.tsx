import preview from "#/storybook/preview.tsx";
import { PairToggle } from "./pair-toggle.tsx";

const meta = preview.meta({
    title: "Components/PairToggle",
    component: PairToggle,
    args: { first: "dark", second: "light", active: "first" as const },
});

export const Default = meta.story();

export const Disabled = meta.story({ args: { disabled: true } });
