import type { ReactNode } from "react";
import styles from "./dock-rail.module.css";

/** Pins its children to the bottom-right corner of the viewport. */
export function DockRail({ children }: { children: ReactNode }) {
    return (
        <div data-layout="DockRail" className={styles.root}>
            {children}
        </div>
    );
}
