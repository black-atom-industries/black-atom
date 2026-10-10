import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";

export default function (
    primaries: Theme.Primaries,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    return createPalette(
        {
            black: primaries.d20,
            gray: primaries.m10,

            darkRed: primaries.m20,
            red: primaries.m20,

            darkYellow: primaries.m30,
            yellow: primaries.m30,

            darkGreen: primaries.m40,
            green: primaries.m40,

            darkCyan: primaries.m30,
            cyan: primaries.m30,

            darkBlue: primaries.m20,
            blue: primaries.m20,

            darkMagenta: primaries.m30,
            magenta: primaries.m30,

            lightGray: primaries.m40,
            white: primaries.l10,
        },
        opts,
    );
}
