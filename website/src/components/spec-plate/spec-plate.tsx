import { cva, type VariantProps } from "cva";
import type { ReactNode } from "react";
import styles from "./spec-plate.module.css";

const valueVariants = cva({
    base: styles.value,
    variants: {
        tone: {
            default: null,
            accent: styles.accent,
            good: styles.good,
            fair: styles.fair,
        },
    },
});

type Cell = {
    label: string;
    value: string;
    note?: string;
} & VariantProps<typeof valueVariants>;

type Props = {
    /** Theme colors along the top edge, drawn as equal bands. */
    strip: readonly string[];
    cells: readonly Cell[];
    keyLine: ReactNode;
};

/** A theme's key facts on one plate: a color strip, a grid of cells and a footer line. */
export function SpecPlate({ strip, cells, keyLine }: Props) {
    return (
        <div data-component="SpecPlate" className={styles.root}>
            <div className={styles.strip} aria-hidden="true">
                {strip.map((color, index) => (
                    <i key={index} style={{ background: color }} />
                ))}
            </div>
            <dl className={styles.cells}>
                {cells.map((cell) => (
                    <div key={cell.label} className={styles.cell}>
                        <dt className={styles.label}>{cell.label}</dt>
                        <dd className={valueVariants({ tone: cell.tone })}>{cell.value}</dd>
                        {cell.note !== undefined && <dd className={styles.note}>{cell.note}</dd>}
                    </div>
                ))}
            </dl>
            <p className={styles.keyLine}>{keyLine}</p>
        </div>
    );
}
