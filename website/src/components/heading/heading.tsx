import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import type { ReactNode } from "react";
import styles from "./heading.module.css";

const headingVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            display: styles.display,
            "display-sm": styles.displaySm,
            section: styles.section,
            title: styles.title,
            item: styles.item,
        },
    },
});

type Variant = NonNullable<VariantProps<typeof headingVariants>["variant"]>;

const tagByVariant = {
    display: "h1",
    "display-sm": "h1",
    section: "h2",
    title: "h3",
    item: "h4",
} as const satisfies Record<Variant, keyof React.JSX.IntrinsicElements>;

type Props = Omit<useRender.ComponentProps<"h2">, "className"> & {
    variant?: Variant;
    /** Second line of a display heading, set in the foreground colour. */
    subtitle?: ReactNode;
};

export function Heading({ render, variant = "section", subtitle, children, ...props }: Props) {
    return useRender({
        defaultTagName: tagByVariant[variant],
        render,
        props: mergeProps(
            {
                className: headingVariants({ variant }),
                "data-component": "Heading",
                children: (
                    <>
                        {children}
                        {subtitle !== undefined && <span className={styles.line}>{subtitle}</span>}
                    </>
                ),
            },
            props,
        ),
    });
}
