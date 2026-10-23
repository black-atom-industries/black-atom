import styles from "./placeholder-slot.module.css";

/** Marks where an image still has to go, naming what belongs there. */
export function PlaceholderSlot({ label }: { label: string }) {
    return (
        <div data-component="PlaceholderSlot" className={styles.root}>
            <span className={styles.label}>{label}</span>
        </div>
    );
}
