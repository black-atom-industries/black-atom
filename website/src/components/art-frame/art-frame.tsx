import type { ReactNode } from "react";
import styles from "./art-frame.module.css";

type Props = {
    /** What the illustration shows, for screen readers. */
    label: string;
    caption?: string;
    children: ReactNode;
};

export function ArtFrame({ label, caption, children }: Props) {
    return (
        <div data-component="ArtFrame" className={styles.root} role="img" aria-label={label}>
            {children}
            {caption !== undefined && (
                <span aria-hidden="true" className={styles.caption}>
                    {caption}
                </span>
            )}
        </div>
    );
}
