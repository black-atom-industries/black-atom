import type { ReactNode } from "react";
import styles from "./header-bar.module.css";

export function HeaderBar({ children }: { children: ReactNode }) {
    return (
        <header data-component="HeaderBar" className={styles.root}>
            {children}
        </header>
    );
}
