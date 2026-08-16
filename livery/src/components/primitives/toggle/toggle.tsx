import { cva, type VariantProps } from "cva";
import styles from "./toggle.module.css";

export const toggleVariants = cva({
    base: styles.root,
    variants: {
        on: {
            true: styles.on,
            false: "",
        },
    },
    defaultVariants: {
        on: false,
    },
});

type Props = VariantProps<typeof toggleVariants> & {
    disabled?: boolean;
    onChange?: () => void;
    className?: string;
};

/**
 * Square-knob toggle, 38x22, 0 radius. On = positive knob at right + strong
 * border; off = muted knob at left. Usually leads a settings row; `space`
 * toggles the focused row.
 *
 * Spec: docs/design-system/reference/components/forms/Toggle.jsx
 */
export function Toggle({ on, disabled, onChange, className }: Props) {
    return (
        <button
            data-component="toggle"
            type="button"
            role="switch"
            aria-checked={on ?? false}
            disabled={disabled}
            onClick={onChange}
            className={toggleVariants({ on, className })}
        >
            <span className={styles.knob} />
        </button>
    );
}
