import { cva, type VariantProps } from "cva";
import styles from "./rule.module.css";

const ruleVariants = cva({
    base: styles.root,
    variants: {
        orientation: { horizontal: styles.horizontal, vertical: styles.vertical },
    },
});

type Props = VariantProps<typeof ruleVariants>;

export function Rule({ orientation = "horizontal" }: Props) {
    return (
        <span aria-hidden="true" data-component="Rule" className={ruleVariants({ orientation })} />
    );
}
