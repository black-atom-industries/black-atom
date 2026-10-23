import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./page-grid.module.css";

const pageGridVariants = cva({
    base: styles.root,
    variants: {
        columns: { two: styles.two, three: styles.three, four: styles.four },
        align: { stretch: null, start: styles.alignStart, center: styles.alignCenter },
    },
});

type Props = Omit<useRender.ComponentProps<"div">, "className"> &
    VariantProps<typeof pageGridVariants>;

/** Columns collapse to one as the viewport narrows; each column keeps a minimum width. */
export function PageGrid({ render, columns = "two", align = "stretch", ...props }: Props) {
    return useRender({
        render,
        props: mergeProps(
            { className: pageGridVariants({ columns, align }), "data-layout": "PageGrid" },
            props,
        ),
    });
}
