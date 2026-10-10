import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";

export default function (
    primaries: Theme.Primaries,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    return createPalette(
        {
            black: primaries.d40,
            gray: primaries.m20,

            darkRed: primaries.m40,
            red: primaries.m40,

            darkYellow: primaries.m30,
            yellow: primaries.m30,

            darkGreen: primaries.m40,
            green: primaries.m40,

            darkCyan: primaries.m40,
            cyan: primaries.m40,

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
