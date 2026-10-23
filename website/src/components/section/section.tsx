import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./section.module.css";

const sectionVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            default: null,
            hero: styles.hero,
            product: styles.product,
            page: styles.page,
            compact: styles.compact,
            footer: styles.footer,
        },
    },
});

type Props = Omit<useRender.ComponentProps<"section">, "className"> &
    VariantProps<typeof sectionVariants>;

export function Section({ render, variant = "default", children, ...props }: Props) {
    return useRender({
        defaultTagName: "section",
        render,
        props: mergeProps(
            {
                className: sectionVariants({ variant }),
                "data-layout": "Section",
                children: <div className={styles.wrap}>{children}</div>,
            },
            props,
        ),
    });
}
