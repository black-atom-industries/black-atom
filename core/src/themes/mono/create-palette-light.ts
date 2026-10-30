import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";

export default function (
    primaries: Theme.Primaries,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    return createPalette(
        {
            black: primaries.d40,
            gray: primaries.m10,

            darkRed: primaries.m20,
            red: primaries.m30,

            darkYellow: primaries.m20,
            yellow: primaries.m30,

            darkGreen: primaries.m20,
            green: primaries.m30,

            darkCyan: primaries.m20,
            cyan: primaries.m30,

            darkBlue: primaries.m20,
            blue: primaries.m30,

            darkMagenta: primaries.m20,
            magenta: primaries.m30,

            lightGray: primaries.m40,
            white: primaries.m40,
        },
        opts,
    );
}
