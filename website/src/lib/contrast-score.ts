import type * as Theme from "@black-atom/core";
import { analyzeThemeContrast } from "@black-atom/core/contrast";

/** Ratio the score counts as readable: WCAG AA for large text and UI components. */
export const readableRatio = 3;

/** How many of a theme's contrast pairs reach `readableRatio`, and their share from 0 to 1. */
export function contrastScore(theme: Theme.Definition) {
    const pairs = analyzeThemeContrast(theme).categories.flatMap((category) => category.pairs);
    const below = pairs.filter((pair) => pair.ratio < readableRatio).length;
    return { score: (pairs.length - below) / pairs.length, below, total: pairs.length };
}
