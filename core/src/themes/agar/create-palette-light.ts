import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";

export default function (
    primaries: Theme.Primaries,
    palette: Omit<Theme.Palette, "black" | "gray" | "lightGray" | "white">,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    return createPalette(
        {
            ...palette,
            black: primaries.d40,
            gray: primaries.m10,
            lightGray: primaries.l10,
            white: primaries.l30,
        },
        opts,
    );
}
