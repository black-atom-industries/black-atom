import preview from "#/storybook/preview.tsx";
import { Kbd } from "./kbd.tsx";

const meta = preview.meta({ title: "Components/Kbd", component: Kbd, args: { children: "s" } });

export const Key = meta.story();

export const Command = meta.story({ args: { children: ":Iter" } });
