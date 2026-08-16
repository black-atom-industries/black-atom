import { cva, type VariantProps } from "cva";
import styles from "./swatch.module.css";

export const swatchVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            cell: styles.cell,
            band: styles.band,
            pips: styles.pips,
        },
    },
    defaultVariants: {
        variant: "cell",
    },
});

type Props = VariantProps<typeof swatchVariants> & {
    /** The color (band/cell), e.g. "#C46A5A". Content, not a token. */
    color?: string;
    /** Band label, e.g. "ACCENT · BURGUNDY". */
    label?: string;
    /** Hex caption; defaults to color. */
    hex?: string;
    /** Provenance tag on bands, e.g. "DERIVED FROM PALETTE.RED". */
    tag?: string;
    /** Colors for variant="pips". */
    colors?: string[];
    className?: string;
};

/**
 * Theme color display — the one sanctioned home of saturated color (it's
 * content, not chrome). `band` = full-width labeled bar (accents); `cell` =
 * grid swatch + hex; `pips` = mini row (list rows).
 *
 * Colors arrive via props (`color`/`colors`) applied through inline style,
 * since palette values are runtime content, never design tokens.
 *
 * Spec: docs/design-system/reference/components/display/Swatch.jsx
 */
export function Swatch({ variant, color, label, hex, tag, colors, className }: Props) {
    if (variant === "pips") {
        return (
            <span data-component="swatch" className={swatchVariants({ variant, className })}>
                {(colors ?? []).map((c, i) => (
                    <span key={i} className={styles.pip} style={{ background: c }} />
                ))}
            </span>
        );
    }

    if (variant === "band") {
        return (
            <div
                data-component="swatch"
                className={swatchVariants({ variant, className })}
                style={{ background: color }}
            >
                <span className={styles.bandLabel}>{label}</span>
                {tag && <span className={styles.bandTag}>{tag}</span>}
                <span className={styles.bandHex}>{hex || color}</span>
            </div>
        );
    }

    return (
        <div data-component="swatch" className={swatchVariants({ variant, className })}>
            <div className={styles.cellSwatch} style={{ background: color }} />
            <div className={styles.cellHex}>{(hex || color || "").replace("#", "")}</div>
        </div>
    );
}
