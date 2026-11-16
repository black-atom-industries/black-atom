import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (): Theme.Feedback {
    return {
        negative: oklch(0.56, 0.18, 0),
        success: oklch(0.55, 0.19, 145),
        info: oklch(0.55, 0.11, 200),
        warning: oklch(0.65, 0.16, 65),
    };
}
