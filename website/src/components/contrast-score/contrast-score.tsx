import { cva } from "cva";
import styles from "./contrast-score.module.css";

const fillVariants = cva({
    base: styles.fill,
    variants: {
        tone: { good: styles.good, fair: styles.fair, poor: styles.poor },
    },
});

export type ContrastResult = {
    /** Share of pairs, 0 to 1, that reach `ratio`. */
    score: number;
    /** Pairs under `ratio`. */
    below: number;
};

type Props = ContrastResult & {
    total: number;
    ratio: number;
    previous?: ContrastResult;
};

function percent(score: number) {
    return `${Math.round(score * 100)}%`;
}

function toneFor(score: number) {
    if (score >= 0.95) return "good";
    if (score >= 0.85) return "fair";
    return "poor";
}

export function ContrastScore({ score, below, total, ratio, previous }: Props) {
    return (
        <div data-component="ContrastScore" className={styles.root}>
            <span className={styles.label}>Contrast</span>
            <span className={styles.value}>{percent(score)}</span>
            <span className={styles.track} aria-hidden="true">
                <span
                    className={fillVariants({ tone: toneFor(score) })}
                    style={{ width: percent(score) }}
                />
            </span>
            <span className={styles.detail}>
                {total - below} of {total} pairs reach {ratio}:1 · {below} below
            </span>
            {previous && (
                <span className={styles.detail}>
                    (was {percent(previous.score)} · {previous.below} below)
                </span>
            )}
        </div>
    );
}
