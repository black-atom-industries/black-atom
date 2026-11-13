import { cva } from "cva";
import { contrastGrade, type ContrastGrade as Grade } from "#/lib/contrast-grade.ts";
import styles from "./contrast-grade.module.css";

const pipVariants = cva({
    base: styles.pip,
    variants: {
        isFilled: { false: null, true: styles.filled },
    },
});

const gradeVariants = cva({
    base: styles.root,
    variants: {
        tone: {
            success: styles.success,
            warning: styles.warning,
            negative: styles.negative,
            subtle: styles.subtle,
        },
    },
});

const pipCounts: Record<Grade, number> = { aaa: 3, aa: 2, large: 1, low: 0 };
const labels: Record<Grade, string> = { aaa: "AAA", aa: "AA", large: "Large", low: "Low" };
const tones: Record<Grade, "success" | "warning" | "negative"> = {
    aaa: "success",
    aa: "success",
    large: "warning",
    low: "negative",
};

type Props = {
    ratio: number;
    /** A border or guide: drawn, not read, so it carries no grade. */
    isLine?: boolean;
};

/** A contrast ratio with its grade as three pips, a number and a word. */
export function ContrastGrade({ ratio, isLine = false }: Props) {
    const grade = contrastGrade(ratio);
    const filled = pipCounts[grade];

    if (isLine) {
        return (
            <span data-component="ContrastGrade" className={gradeVariants({ tone: "subtle" })}>
                <span className={styles.ratio}>{ratio.toFixed(1)}</span>
                <span className={styles.label}>Line</span>
            </span>
        );
    }

    return (
        <span data-component="ContrastGrade" className={gradeVariants({ tone: tones[grade] })}>
            <span className={styles.pips} aria-hidden="true">
                {[0, 1, 2].map((index) => (
                    <i key={index} className={pipVariants({ isFilled: index < filled })} />
                ))}
            </span>
            <span className={styles.ratio}>{ratio.toFixed(1)}</span>
            <span className={styles.label}>{labels[grade]}</span>
        </span>
    );
}
