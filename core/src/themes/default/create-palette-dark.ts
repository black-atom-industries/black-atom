import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";
import { oklch, shade } from "../../utils/color.ts";

export default function (
    primaries: Theme.Primaries,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    const red = oklch(0.75, 0.15, 25);
    const yellow = oklch(0.75, 0.15, 85);
    const cyan = oklch(0.75, 0.12, 200);

    return createPalette(
        {
            black: primaries.d40,
            gray: primaries.m20,

            darkRed: shade(red, -0.1),
            red,

            darkYellow: shade(yellow, -0.1),
            yellow,

            darkGreen: primaries.m40,
            green: primaries.m40,

            darkCyan: shade(cyan, -0.1),
            cyan,

            darkBlue: primaries.m20,
            blue: primaries.m20,

            darkMagenta: primaries.m30,
            magenta: primaries.m30,

            lightGray: primaries.l20,
            white: primaries.l30,
        },
        opts,
    );
}
