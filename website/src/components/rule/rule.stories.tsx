import preview from "#/storybook/preview.tsx";
import { Rule } from "./rule.tsx";

const meta = preview.meta({ title: "Components/Rule", component: Rule });

export const Horizontal = meta.story();

export const Vertical = meta.story({ args: { orientation: "vertical" } });
