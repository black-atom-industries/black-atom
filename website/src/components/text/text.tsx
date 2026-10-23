import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./text.module.css";

const textVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            body: null,
            lead: styles.lead,
            tagline: styles.tagline,
            small: styles.small,
        },
        tone: { default: null, subtle: styles.subtle },
    },
});

type Props = Omit<useRender.ComponentProps<"p">, "className"> & VariantProps<typeof textVariants>;

export function Text({ render, variant = "body", tone = "default", ...props }: Props) {
    return useRender({
        defaultTagName: "p",
        render,
        props: mergeProps(
            { className: textVariants({ variant, tone }), "data-component": "Text" },
            props,
        ),
    });
}
