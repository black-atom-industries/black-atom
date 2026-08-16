import { cva, type VariantProps } from "cva";
import styles from "./badge.module.css";

export const badgeVariants = cva({
    base: styles.root,
    variants: {
        size: {
            default: "",
            mini: styles.sizeMini,
        },
    },
    defaultVariants: {
        size: "default",
    },
});

type Props = VariantProps<typeof badgeVariants> & {
    children: React.ReactNode;
    className?: string;
};

/**
 * Bordered uppercase tag, e.g. appearance: DARK / LIGHT. `size="mini"` for
 * single-letter list-row tags (D/L).
 *
 * Spec: docs/design-system/reference/components/display/Badge.jsx
 */
export function Badge({ size, children, className }: Props) {
    return (
        <span data-component="badge" className={badgeVariants({ size, className })}>
            {children}
        </span>
    );
}
