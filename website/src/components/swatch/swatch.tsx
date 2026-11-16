import { cva, type VariantProps } from "cva";
import { ColorSource } from "#/components/color-source/index.ts";
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
    /** The color's path in the theme: the tile's anchor, and where its color comes from. */
    path?: string;
};

export function Swatch({ size = "bar", color, label, path }: Props) {
    if (size === "tile") {
        return (
            <span id={path} data-component="Swatch" className={swatchVariants({ size })}>
                <i aria-hidden="true" className={styles.chip} style={{ background: color }} />
                {label !== undefined && <span className={styles.label}>{label}</span>}
                {path !== undefined && <ColorSource path={path} />}
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
