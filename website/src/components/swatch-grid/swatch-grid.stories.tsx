import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { Swatch } from "#/components/swatch/index.ts";
import { SwatchGrid } from "./swatch-grid.tsx";

const theme = themeCatalog["black-atom-default-dark"];

const meta = preview.meta({
    title: "Layout/SwatchGrid",
    component: SwatchGrid,
});

export const Ramp = meta.story({
    args: {
        variant: "ramp",
        children: Object.entries(theme.primaries).map(([key, color]) => (
            <Swatch key={key} size="tile" color={color} label={key} />
        )),
    },
});

export const Tiles = meta.story({
    args: {
        children: Object.entries(theme.palette).map(([key, color]) => (
            <Swatch key={key} size="tile" color={color} label={`${key} · ${color}`} />
        )),
    },
});
