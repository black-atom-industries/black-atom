import styles from "./swatch-pair.module.css";

type Slot = { label: string; color: string };

type Props = {
    first: Slot;
    second: Slot;
};

function Half({ label, color }: Slot) {
    return (
        <div className={styles.half}>
            <i aria-hidden="true" className={styles.chip} style={{ background: color }} />
            <span className={styles.label}>
                {label} · {color}
            </span>
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
