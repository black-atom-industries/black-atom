import type * as Theme from "../../types/theme.ts";
import { createPalette } from "../create-palette.ts";
import { shade } from "../../utils/color.ts";

export default function (
    primaries: Theme.Primaries,
    opts?: Parameters<typeof createPalette>[1],
): Theme.Palette {
    const red = shade(primaries.m40, 0.22);
    const yellow = shade(primaries.m40, 0.22);
    const green = shade(primaries.m40, 0.08);
    const cyan = shade(primaries.m40, 0.08);
    const blue = shade(primaries.m40, -0.06);
    const magenta = shade(primaries.m40, -0.06);

    return createPalette(
        {
            black: primaries.d40,
            gray: primaries.m30,

            darkRed: shade(red, -0.07),
            red,

            darkYellow: shade(yellow, -0.07),
            yellow,

            darkGreen: shade(green, -0.07),
            green,

            darkCyan: shade(cyan, -0.07),
            cyan,

            darkBlue: shade(blue, -0.07),
            blue,

            darkMagenta: shade(magenta, -0.07),
            magenta,

            lightGray: primaries.m40,
            white: primaries.l20,
        },
        opts,
    );
}
