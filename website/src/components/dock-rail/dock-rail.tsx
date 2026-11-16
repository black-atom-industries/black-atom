import type { ReactNode } from "react";
import styles from "./dock-rail.module.css";

/** Stacks the dock's buttons in a column. */
export function DockRail({ children }: { children: ReactNode }) {
    return (
        <div data-layout="DockRail" className={styles.root}>
            {children}
        </div>
    );
}
