import { cva, type VariantProps } from "cva";
import styles from "./kv-row.module.css";

export const kvRowVariants = cva({
    base: styles.root,
});

export const kvRowValueVariants = cva({
    base: styles.value,
    variants: {
        intent: {
            positive: styles.intentPositive,
            warn: styles.intentWarn,
            negative: styles.intentNegative,
        },
    },
});

type Props = VariantProps<typeof kvRowValueVariants> & {
    /** Uppercase key, e.g. "COLLECTION". */
    label: string;
    children: React.ReactNode;
    className?: string;
};

/**
 * Datasheet key-value row: uppercase hint label left, mono value right.
 * Stack in a 6px-gap column under a SectionHeader.
 *
 * Spec: docs/design-system/reference/components/display/KVRow.jsx
 */
export function KVRow({ label, children, intent, className }: Props) {
    return (
        <div data-component="kv-row" className={kvRowVariants({ className })}>
            <span className={styles.label}>{label}</span>
            <span className={kvRowValueVariants({ intent })}>{children}</span>
        </div>
    );
}
