import type { ReactNode } from "react";
import styles from "./kbd.module.css";

export function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd data-component="Kbd" className={styles.root}>
            {children}
        </kbd>
    );
}
