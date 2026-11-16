/** WCAG 2.1 ratios for normal text: enhanced (AAA) and minimum (AA). */
const enhancedRatio = 7;
const minimumRatio = 4.5;
/** WCAG 2.1 minimum for large text and UI components. */
const readableRatio = 3;

const contrastGrades = ["low", "large", "aa", "aaa"] as const;

export type ContrastGrade = (typeof contrastGrades)[number];

/**
 * Grades a contrast ratio for text: `aaa` and `aa` suit any text, `large` only large text and
 * UI marks, `low` is hard to read.
 */
export function contrastGrade(ratio: number): ContrastGrade {
    if (ratio >= enhancedRatio) return "aaa";
    if (ratio >= minimumRatio) return "aa";
    if (ratio >= readableRatio) return "large";
    return "low";
}
