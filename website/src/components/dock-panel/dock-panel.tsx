import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import styles from "./dock-panel.module.css";

type Props = {
    title: string;
    closeLabel: string;
    children: ReactNode;
};

/** The popup of a dock `Dialog.Root`. */
export function DockPanel({ title, closeLabel, children }: Props) {
    return (
        <Dialog.Portal>
            <Dialog.Popup data-component="DockPanel" className={styles.root}>
                <div className={styles.head}>
                    <Dialog.Title className={styles.title}>{title}</Dialog.Title>
                    <Dialog.Close className={styles.close} aria-label={closeLabel}>
                        ×
                    </Dialog.Close>
                </div>
                {children}
            </Dialog.Popup>
        </Dialog.Portal>
    );
}
