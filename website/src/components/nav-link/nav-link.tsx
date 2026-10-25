import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import styles from "./nav-link.module.css";

type Props = Omit<useRender.ComponentProps<"a">, "className"> & {
    /** Hidden on phones, where the header keeps to one row. */
    number?: string;
    /** Sits on its own backing, for links placed straight on the background scene. */
    isChip?: boolean;
};

/** Underlined while it points at the current page (`aria-current="page"`). */
export function NavLink({ render, number, isChip = false, children, ...props }: Props) {
    return useRender({
        defaultTagName: "a",
        render,
        props: mergeProps(
            {
                className: isChip ? `${styles.root} ${styles.chip}` : styles.root,
                "data-component": "NavLink",
                children: (
                    <>
                        {number !== undefined && <i className={styles.number}>{number}</i>}
                        {children}
                    </>
                ),
            },
            props,
        ),
    });
}
