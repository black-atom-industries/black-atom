import preview from "#/storybook/preview.tsx";
import { NavLink } from "./nav-link.tsx";

const meta = preview.meta({
    title: "Components/NavLink",
    component: NavLink,
    args: { href: "#iter", number: "02", children: "iter.nvim" },
});

export const Default = meta.story();

export const Current = meta.story({ args: { "aria-current": "page" } });

export const Secondary = meta.story({
    args: { number: undefined, isSecondary: true, children: "Changelog" },
});
