import { cva } from "cva";
import type { ReactNode } from "react";
import styles from "./pill.module.css";

const pillVariants = cva({
    base: styles.root,
    variants: {
        isActive: { false: null, true: styles.active },
    },
});

type Props = {
    isActive?: boolean;
    hasDot?: boolean;
    children: ReactNode;
};

export function Pill({ isActive = false, hasDot = false, children }: Props) {
    return (
        <span data-component="Pill" className={pillVariants({ isActive })}>
            {hasDot && <i aria-hidden="true" className={styles.dot} />}
            {children}
        </span>
    );
}
