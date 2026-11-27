import type * as Theme from "../../types/theme.ts";

export default function (palette: Theme.Palette): Theme.Feedback {
    return {
        negative: palette.red,
        success: palette.green,
        info: palette.blue,
        warning: palette.yellow,
    };
}
