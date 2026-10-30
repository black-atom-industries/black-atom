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

            darkRed: primaries.m10,
            red: primaries.m20,

            darkYellow: primaries.m10,
            yellow: primaries.m20,

            darkGreen: primaries.m10,
            green: primaries.m20,

            darkCyan: primaries.m10,
            cyan: primaries.m20,

            darkBlue: primaries.m10,
            blue: primaries.m20,

            darkMagenta: primaries.m10,
            magenta: primaries.m20,

            lightGray: primaries.m40,
            white: primaries.l10,
        },
        opts,
    );
}
