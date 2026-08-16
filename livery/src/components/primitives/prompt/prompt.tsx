import { useState } from "react";
import { cva, type VariantProps } from "cva";
import styles from "./prompt.module.css";

export const promptVariants = cva({
    base: styles.root,
    variants: {
        focused: {
            true: styles.focused,
            false: "",
        },
    },
    defaultVariants: {
        focused: false,
    },
});

type Props = VariantProps<typeof promptVariants> & {
    /** Current query. Empty string renders the placeholder. */
    value?: string;
    placeholder?: string;
    /** Match counter, e.g. "2/24". */
    count?: string;
    onChange?: (value: string) => void;
    /** Enter pressed inside the input — e.g. hand focus back to the list. */
    onSubmit?: () => void;
    /** Ref to the underlying input — e.g. to focus it from a `/` hotkey. */
    inputRef?: React.Ref<HTMLInputElement>;
    className?: string;
};

/**
 * Command-line search prompt — the `»` glyph, recessed surface, block caret
 * (native caret hidden; while focused the input is sized to its content in
 * `ch` so the block caret rides the typed text). Search is name-only by
 * convention; collection/appearance filtering belongs to Chips or the Dialog.
 *
 * Spec: docs/design-system/reference/components/forms/Prompt.jsx
 */
export function Prompt(
    { value, placeholder, count, focused, onChange, onSubmit, inputRef, className }: Props,
) {
    const [hasFocus, setHasFocus] = useState(false);
    const showCaret = hasFocus || focused === true;
    const text = value ?? "";

    return (
        <div
            data-component="prompt"
            className={promptVariants({ focused: showCaret, className })}
        >
            <span className={styles.glyph}>»</span>
            <span className={showCaret ? styles.typing : styles.typingIdle}>
                <input
                    ref={inputRef}
                    className={styles.input}
                    style={showCaret
                        ? { width: `calc(${text.length}ch + 1px)`, flex: "none" }
                        : undefined}
                    type="text"
                    value={text}
                    placeholder={showCaret ? "" : placeholder ?? "search theme names — /"}
                    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                    onFocus={() => setHasFocus(true)}
                    onBlur={() => setHasFocus(false)}
                    onKeyDown={onSubmit ? (e) => e.key === "Enter" && onSubmit() : undefined}
                    readOnly={!onChange}
                />
                {showCaret ? <span className={styles.caret} /> : null}
            </span>
            {count ? <span className={styles.count}>{count}</span> : null}
        </div>
    );
}
