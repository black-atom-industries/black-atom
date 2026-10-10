import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (_accents: Theme.Accents): Theme.Feedback {
    return {
        negative: oklch(0.65, 0.2, 25),
        success: oklch(0.65, 0.2, 120),
        info: oklch(0.65, 0.2, 225),
        warning: oklch(0.65, 0.2, 80),
    };
}
