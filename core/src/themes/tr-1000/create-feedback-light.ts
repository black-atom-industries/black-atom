import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (): Theme.Feedback {
    return {
        negative: oklch(0.48, 0.19, 21),
        success: oklch(0.44, 0.12, 145),
        info: oklch(0.44, 0.11, 230),
        warning: oklch(0.46, 0.11, 75),
    };
}
