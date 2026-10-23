import { cva, type VariantProps } from "cva";
import styles from "./swatch.module.css";

const swatchVariants = cva({
    base: styles.root,
    variants: {
        size: { dot: styles.dot, icon: styles.icon, bar: styles.bar, tile: styles.tile },
    },
});

type Props = VariantProps<typeof swatchVariants> & {
    /** Any CSS colour, a theme variable included: `var(--ba-accent)`. */
    color: string;
    /** Caption under a tile, such as `accent · #d65f5f`. */
    label?: string;
};

export function Swatch({ size = "bar", color, label }: Props) {
    if (size === "tile") {
        return (
            <span data-component="Swatch" className={swatchVariants({ size })}>
                <i aria-hidden="true" className={styles.chip} style={{ background: color }} />
                {label !== undefined && <span className={styles.label}>{label}</span>}
            </span>
        );
    }

    return (
        <i
            aria-hidden="true"
            data-component="Swatch"
            className={swatchVariants({ size })}
            style={{ background: color }}
        />
    );
}
