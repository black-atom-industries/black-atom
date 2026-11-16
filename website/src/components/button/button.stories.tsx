import preview from "#/storybook/preview.tsx";
import { Button } from "./button.tsx";

const meta = preview.meta({
    title: "Components/Button",
    component: Button,
    args: { children: "Install", variant: "cta" },
});

export const Cta = meta.story();

export const Link = meta.story({
    args: { variant: "link", children: "GitHub ↗", render: <a href="#github" /> },
});

export const Chips = meta.story({
    render: () => (
        <div style={{ display: "flex", gap: 8 }}>
            <Button variant="chip" isActive>
                All
            </Button>
            <Button variant="chip">Black Atom</Button>
            <Button variant="chip">radar.nvim</Button>
        </div>
    ),
});

export const Square = meta.story({
    args: { variant: "square", children: "›", "aria-label": "Next theme" },
});

export const Inline = meta.story({
    render: () => (
        <div style={{ display: "flex", gap: 16 }}>
            <Button variant="inline">Wear</Button>
            <Button variant="inline" isSubtle render={<a href="#docs" />}>
                Docs
            </Button>
        </div>
    ),
});
