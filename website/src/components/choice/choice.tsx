import type { ButtonHTMLAttributes } from "react";
import styles from "./choice.module.css";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type"> & {
    isSelected: boolean;
};

/** One option of a set, marked with a dot when selected. */
export function Choice({ isSelected, ...props }: Props) {
    return (
        <button
            type="button"
            data-component="Choice"
            className={styles.root}
            aria-pressed={isSelected}
            {...props}
        />
    );
}
