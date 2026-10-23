import preview from "#/storybook/preview.tsx";
import { Swatch } from "./swatch.tsx";

const meta = preview.meta({
    title: "Components/Swatch",
    component: Swatch,
    args: { color: "var(--ba-accent)" },
});

export const Bar = meta.story({
    render: (args) => (
        <div style={{ width: 40 }}>
            <Swatch {...args} />
        </div>
    ),
});

export const Tile = meta.story({
    args: { size: "tile", label: "accent" },
    render: (args) => (
        <div style={{ width: 120 }}>
            <Swatch {...args} />
        </div>
    ),
});

export const Dot = meta.story({ args: { size: "dot", color: "var(--ba-syn-keyword)" } });

export const Icon = meta.story({ args: { size: "icon" } });
