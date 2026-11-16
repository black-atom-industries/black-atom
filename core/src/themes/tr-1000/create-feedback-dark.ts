import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (): Theme.Feedback {
    return {
        negative: oklch(0.7, 0.18, 21),
        success: oklch(0.76, 0.13, 145),
        info: oklch(0.76, 0.1, 225),
        warning: oklch(0.8, 0.13, 85),
    };
}
