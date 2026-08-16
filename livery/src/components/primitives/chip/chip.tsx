import { cva, type VariantProps } from "cva";
import styles from "./chip.module.css";

export const chipVariants = cva({
    base: styles.root,
    variants: {
        active: {
            true: styles.active,
            false: "",
        },
    },
    defaultVariants: {
        active: false,
    },
});

type Props = VariantProps<typeof chipVariants> & {
    /** Keyboard focus override, e.g. when a sibling input (RadioGroup) owns focus. */
    focused?: boolean;
    /** Hotkey shown before the label, e.g. "3", tinted positive (inherited when active). */
    hotkey?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    /** Remove from tab order, e.g. when a sibling input (RadioGroup) is the real tab stop. */
    tabIndex?: number;
    className?: string;
};

/**
 * Filter/selection chip — clickable and keyboard-addressable. Active state is
 * a full contrast inversion, never a color fill.
 *
 * Compose in a flex row with 6px gap; separate groups with a 1px vertical
 * rule.
 *
 * Spec: docs/design-system/reference/components/forms/Chip.jsx
 */
export function Chip(
    { active, focused, hotkey, children, onClick, disabled, tabIndex, className }: Props,
) {
    return (
        <button
            data-component="chip"
            type="button"
            disabled={disabled}
            onClick={onClick}
            tabIndex={tabIndex}
            data-focused={focused ? "" : undefined}
            className={chipVariants({ active, className })}
        >
            {hotkey ? <span className={styles.hotkey}>{hotkey}</span> : null}
            {children}
        </button>
    );
}
