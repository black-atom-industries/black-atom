import { ColorSource } from "#/components/color-source/index.ts";
import styles from "./swatch-pair.module.css";

type Slot = {
    label: string;
    color: string;
    /** The color's path in the theme, to name where it comes from. */
    path?: string;
};

type Props = {
    first: Slot;
    second: Slot;
};

function Half({ label, color, path }: Slot) {
    return (
        <div id={path} className={styles.half}>
            <i aria-hidden="true" className={styles.chip} style={{ background: color }} />
            <span className={styles.label}>
                {label} · {color}
            </span>
            {path !== undefined && <ColorSource path={path} />}
        </div>
    );
}

/** Two palette slots side by side, such as a dark color and its bright partner. */
export function SwatchPair({ first, second }: Props) {
    return (
        <div data-component="SwatchPair" className={styles.root}>
            <Half {...first} />
            <Half {...second} />
        </div>
    );
}
