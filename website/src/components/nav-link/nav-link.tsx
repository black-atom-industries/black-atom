import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "cva";
import styles from "./nav-link.module.css";

const navLinkVariants = cva({
    base: styles.root,
    variants: {
        /** Hidden on narrow screens. */
        isSecondary: { false: null, true: styles.secondary },
    },
});

type Props = Omit<useRender.ComponentProps<"a">, "className"> & {
    number?: string;
    isSecondary?: boolean;
};

/** Underlined while it points at the current page (`aria-current="page"`). */
export function NavLink({ render, number, isSecondary = false, children, ...props }: Props) {
    return useRender({
        defaultTagName: "a",
        render,
        props: mergeProps(
            {
                className: navLinkVariants({ isSecondary }),
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
