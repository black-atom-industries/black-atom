import type * as Theme from "../../types/theme.ts";
import { oklch as toOklch } from "culori";
import { oklch, tint } from "../../utils/color.ts";

export default function ({ primaries, feedback, accents }: Theme.CreatorContext): Theme.Ui {
    function t(color: string) {
        return tint({ color, with: primaries.l40, amount: 0.15 });
    }

    function pastel(color: string, lightness = 0.9, chroma = 0.07) {
        return oklch(lightness, chroma, toOklch(color)?.h ?? 0);
    }

    const sharedFg = {
        negative: feedback.negative,
        info: feedback.info,
        hint: feedback.warning,
        warn: feedback.warning,
        positive: feedback.success,
        add: feedback.success,
        delete: feedback.negative,
        modify: feedback.info,
    };

    const sharedBg = {
        negative: t(feedback.negative),
        info: t(feedback.info),
        hint: t(feedback.warning),
        warn: t(feedback.warning),
        positive: t(feedback.success),
        add: pastel(feedback.success),
        delete: pastel(feedback.negative, 0.93, 0.04),
        modify: pastel(feedback.info),
    };

    return {
        bg: {
            default: primaries.l30,
            panel: primaries.l20,
            float: primaries.l20,
            active: primaries.l40,
            disabled: primaries.l10,
            hover: primaries.l10,
            selection: primaries.l10,
            search: primaries.l10,
            contrast: primaries.d40,
            ...sharedBg,
        },
        fg: {
            default: primaries.d20,
            subtle: primaries.m10,
            accent: accents.a10,
            disabled: primaries.m30,
            contrast: primaries.l20,
            ...sharedFg,
        },
    };
}
