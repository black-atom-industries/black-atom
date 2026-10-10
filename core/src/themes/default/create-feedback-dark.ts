import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (): Theme.Feedback {
    return {
        negative: oklch(0.7, 0.15, 5),
        success: oklch(0.7, 0.15, 150),
        info: oklch(0.7, 0.15, 200),
        warning: oklch(0.7, 0.15, 65),
    };
}
