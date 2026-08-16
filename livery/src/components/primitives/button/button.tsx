import { cva, type VariantProps } from "cva";
import styles from "./button.module.css";

export const buttonVariants = cva({
    base: styles.root,
    variants: {
        intent: {
            primary: styles.intentPrimary,
            secondary: styles.intentSecondary,
            ghost: styles.intentGhost,
        },
    },
    defaultVariants: {
        intent: "secondary",
    },
});

type Props = VariantProps<typeof buttonVariants> & {
    /** Single-key hotkey shown inside the brackets, tinted positive (e.g. "r"). */
    hotkey?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
};

/**
 * Actuator-style button — bracket notation `[ LABEL ]`, the visual signature
 * for interactive elements. Mono uppercase, 0 radius, no shadows.
 *
 * Intents: `primary` (filled contrast, bold), `secondary` (1px strong
 * border, default), `ghost` (text only, subtle fg).
 *
 * Spec: docs/design-system/reference/components/actions/Button.jsx
 */
export function Button({ intent, hotkey, children, onClick, disabled, className }: Props) {
    return (
        <button
            data-component="button"
            type="button"
            // `aria-disabled`, not the native `disabled` attribute — a truly
            // disabled button is unfocusable, and the browser force-blurs it
            // the instant it becomes disabled (e.g. an action's own running
            // state). That silently drops keyboard focus with nothing to
            // restore it. Staying focusable keeps the row/field the user
            // was on intact; onClick/onKeyDown below enforce the same
            // "can't activate while disabled" behavior by hand.
            aria-disabled={disabled}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(event) => {
                // A focused button is meant to activate on Space/Enter like
                // any native control — stop the keystroke here, before it
                // reaches the app's document-level hotkeys (e.g. Space
                // toggling a sidebar row), which would otherwise fire
                // alongside the button's own native activation. Disabled:
                // swallow the keys so the (still-focusable) button can't be
                // activated, without also blocking other keys the page cares
                // about.
                if (event.key !== " " && event.key !== "Enter") return;
                event.stopPropagation();
                if (disabled) event.preventDefault();
            }}
            className={buttonVariants({ intent, className })}
        >
            [ {hotkey && <span className={styles.hotkey}>{hotkey}&nbsp;</span>}
            {children} ]
        </button>
    );
}
