import type { ReactNode } from "react";
import styles from "./panel.module.css";

export function Panel({ children }: { children: ReactNode }) {
    return (
        <div data-component="Panel" className={styles.root}>
            {children}
        </div>
    );
}
