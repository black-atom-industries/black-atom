import { cva, type VariantProps } from "cva";
import styles from "./color-strip.module.css";

const stripVariants = cva({
    base: styles.root,
    variants: {
        height: { sm: styles.sm, md: styles.md, fill: styles.fill },
    },
});

type Props = VariantProps<typeof stripVariants> & {
    /** CSS colours, eight to a row. */
    colors: readonly string[];
};

export function ColorStrip({ colors, height = "md" }: Props) {
    return (
        <div aria-hidden="true" data-component="ColorStrip" className={stripVariants({ height })}>
            {colors.map((color, index) => (
                <i key={index} style={{ background: color }} />
            ))}
        </div>
    );
}
