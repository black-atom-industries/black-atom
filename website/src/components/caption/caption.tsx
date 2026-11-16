import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./caption.module.css";

const captionVariants = cva({
    base: styles.root,
    variants: {
        tone: { default: null, subtle: styles.subtle, accent: styles.accent },
        size: { md: null, sm: styles.sm },
    },
});

type Props = Omit<useRender.ComponentProps<"span">, "className"> &
    VariantProps<typeof captionVariants>;

export function Caption({ render, tone = "default", size = "md", ...props }: Props) {
    return useRender({
        defaultTagName: "span",
        render,
        props: mergeProps(
            { className: captionVariants({ tone, size }), "data-component": "Caption" },
            props,
        ),
    });
}
