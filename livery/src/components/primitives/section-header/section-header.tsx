import { cva, type VariantProps } from "cva";
import styles from "./section-header.module.css";

export const sectionHeaderVariants = cva({
    base: styles.root,
});

type Props = VariantProps<typeof sectionHeaderVariants> & {
    /** Label, e.g. "PRIMARIES · 12", "JPN — JAPAN (4)". */
    children: React.ReactNode;
    /** Right-aligned meta, e.g. "REV 03". */
    meta?: React.ReactNode;
    className?: string;
};

/**
 * Uppercase mono label + hairline rule. The primary structural pattern —
 * heads every datasheet section and list group.
 *
 * Spec: docs/design-system/reference/components/display/SectionHeader.jsx
 */
export function SectionHeader({ children, meta, className }: Props) {
    return (
        <div data-component="section-header" className={sectionHeaderVariants({ className })}>
            <span className={styles.label}>{children}</span>
            <hr className={styles.rule} />
            {meta && <span className={styles.meta}>{meta}</span>}
        </div>
    );
}
