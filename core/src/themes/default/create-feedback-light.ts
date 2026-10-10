import type * as Theme from "../../types/theme.ts";
import { oklch } from "../../utils/color.ts";

export default function (): Theme.Feedback {
    return {
        negative: oklch(0.75, 0.155, 0),
        success: oklch(0.62, 0.19, 145),
        info: oklch(0.62, 0.1, 200),
        warning: oklch(0.75, 0.16, 65),
    };
}
