import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./button.module.css";

const buttonVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            cta: styles.cta,
            link: styles.link,
            chip: styles.chip,
            square: styles.square,
            inline: styles.inline,
        },
        isSubtle: { false: null, true: styles.subtle },
    },
});

type Props = Omit<useRender.ComponentProps<"button">, "className"> &
    VariantProps<typeof buttonVariants> & {
        isActive?: boolean;
    };

export function Button({
    render,
    variant = "link",
    isSubtle = false,
    isActive = false,
    ...props
}: Props) {
    return useRender({
        defaultTagName: "button",
        render,
        state: { active: isActive },
        props: mergeProps(
            {
                type: render === undefined ? "button" : undefined,
                className: buttonVariants({ variant, isSubtle }),
                "data-component": "Button",
            },
            props,
        ),
    });
}
