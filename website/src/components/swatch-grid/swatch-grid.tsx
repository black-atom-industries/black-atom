import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import styles from "./swatch-grid.module.css";

const gridVariants = cva({
    base: styles.root,
    variants: {
        variant: { ramp: styles.ramp, tiles: styles.tiles },
    },
});

type Props = Omit<useRender.ComponentProps<"div">, "className"> & VariantProps<typeof gridVariants>;

/** Lays out swatch tiles: twelve to a row for a ramp, as many as fit otherwise. */
export function SwatchGrid({ render, variant = "tiles", ...props }: Props) {
    return useRender({
        render,
        props: mergeProps(
            { className: gridVariants({ variant }), "data-layout": "SwatchGrid" },
            props,
        ),
    });
}
