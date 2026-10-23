import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./stack.module.css";

const stackVariants = cva({
    base: styles.root,
    variants: {
        direction: { column: styles.column, row: styles.row },
        gap: {
            none: null,
            "2xs": styles.gap2xs,
            xs: styles.gapXs,
            sm: styles.gapSm,
            md: styles.gapMd,
            lg: styles.gapLg,
            xl: styles.gapXl,
            "2xl": styles.gap2xl,
        },
        align: {
            stretch: null,
            start: styles.alignStart,
            center: styles.alignCenter,
            baseline: styles.alignBaseline,
            end: styles.alignEnd,
        },
        justify: {
            start: null,
            between: styles.justifyBetween,
            end: styles.justifyEnd,
        },
        isWrapped: { false: null, true: styles.wrapped },
        /** A hairline above the stack, separating it from what comes before. */
        isDivided: { false: null, true: styles.divided },
    },
});

type Props = Omit<useRender.ComponentProps<"div">, "className"> &
    VariantProps<typeof stackVariants>;

export function Stack({
    render,
    direction = "column",
    gap = "md",
    align = "stretch",
    justify = "start",
    isWrapped = false,
    isDivided = false,
    ...props
}: Props) {
    return useRender({
        render,
        props: mergeProps(
            {
                className: stackVariants({ direction, gap, align, justify, isWrapped, isDivided }),
                "data-layout": "Stack",
            },
            props,
        ),
    });
}
