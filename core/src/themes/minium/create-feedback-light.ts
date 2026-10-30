import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (_accents: Theme.Accents): Theme.Feedback {
    return {
        negative: oklch(0.55, 0.24, 25),
        success: oklch(0.55, 0.24, 120),
        info: oklch(0.5, 0.24, 225),
        warning: oklch(0.55, 0.24, 80),
    };
}
