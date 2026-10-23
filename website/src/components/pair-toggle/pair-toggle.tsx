import type { ButtonHTMLAttributes } from "react";
import styles from "./pair-toggle.module.css";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type" | "children"> & {
    first: string;
    second: string;
    active: "first" | "second";
};

/** One button that flips between two named states, such as `dark / light`. */
export function PairToggle({ first, second, active, ...props }: Props) {
    return (
        <button type="button" data-component="PairToggle" className={styles.root} {...props}>
            <span data-active={active === "first"}>{first}</span> /{" "}
            <span data-active={active === "second"}>{second}</span>
        </button>
    );
}
