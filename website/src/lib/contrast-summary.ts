import type * as Theme from "@black-atom/core";
import { analyzeThemeContrast } from "@black-atom/core/contrast";
import { type ContrastGrade, contrastGrade } from "./contrast-grade.ts";

export type ContrastTally = {
    total: number;
    counts: Record<ContrastGrade, number>;
    /** The share of ratios at 3:1 or better, from 0 to 1. */
    readableShare: number;
};

/** Grades each ratio and counts the grades. */
export function tallyContrast(ratios: readonly number[]): ContrastTally {
    const counts: Record<ContrastGrade, number> = { aaa: 0, aa: 0, large: 0, low: 0 };
    for (const ratio of ratios) counts[contrastGrade(ratio)] += 1;
    const total = ratios.length;
    return { total, counts, readableShare: total === 0 ? 0 : (total - counts.low) / total };
}

/** The ratio of every pair the theme's contrast analysis checks, in every category. */
export function themeContrastRatios(theme: Theme.Definition): number[] {
    return analyzeThemeContrast(theme).categories.flatMap((category) =>
        category.pairs.map((pair) => pair.ratio),
    );
}
