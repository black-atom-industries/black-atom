import { cva, type VariantProps } from "cva";
import styles from "./scene-anchor.module.css";

const anchorVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            hole: styles.hole,
            "far-hole": styles.farHole,
            wide: styles.wide,
            square: styles.square,
        },
    },
});

type Props = VariantProps<typeof anchorVariants> & {
    /** Describes the scene drawn here; without it the anchor is hidden from screen readers. */
    label?: string;
};

/**
 * Reserves the place the background scene frames, marked with `data-scene-anchor`. `hole` and
 * `far-hole` sit over their section; `wide` and `square` take space in the layout.
 */
export function SceneAnchor({ variant = "hole", label }: Props) {
    return (
        <div
            data-component="SceneAnchor"
            data-scene-anchor={variant}
            className={anchorVariants({ variant })}
            {...(label === undefined
                ? { "aria-hidden": true }
                : { role: "img", "aria-label": label })}
        />
    );
}
