import { cva } from "cva";
import styles from "./key-hint.module.css";

export const keyHintVariants = cva({
    base: styles.root,
});

type Props = {
    /** The key(s), e.g. "j/k", "⏎", "esc". */
    keys: string;
    /** The action label, uppercase, e.g. "NAVIGATE". */
    children: React.ReactNode;
    className?: string;
};

/**
 * Keyboard-hint atom for footers and dialogs: `j/k NAVIGATE`. Key in
 * subtle fg, action label in hint fg. Compose in a flex row for the
 * footer's key vocabulary — every screen names its keys.
 *
 * Spec: docs/design-system/reference/components/actions/KeyHint.jsx
 */
export function KeyHint({ keys, children, className }: Props) {
    return (
        <span data-component="key-hint" className={keyHintVariants({ className })}>
            <span className={styles.keys}>{keys}</span> {children}
        </span>
    );
}
