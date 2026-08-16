import { useRef, useState } from "react";
import { Chip } from "../chip/chip.tsx";
import { getNextRadioGroupIndex, isRadioGroupNavigationKey } from "./radio-group-navigation.ts";
import styles from "./radio-group.module.css";

export type RadioGroupOption = {
    value: string;
    label: string;
    hotkey?: string;
    disabled?: boolean;
};

type Props = {
    options: RadioGroupOption[];
    value: string;
    /** Group name for the underlying native radio inputs. */
    name: string;
    onChange?: (value: string) => void;
    className?: string;
};

/**
 * Segmented single-choice control — Chips where exactly one is active, built
 * on native radio inputs (restyled, visually hidden) for correct a11y
 * semantics and free browser-level radio behavior. Use for 2-4 short options
 * in settings rows.
 *
 * Keyboard: ArrowRight/ArrowDown selects the next enabled option,
 * ArrowLeft/ArrowUp the previous, Home/End jump to the first/last enabled
 * option — all wrapping and skipping disabled options. Decision logic lives
 * in `getNextRadioGroupIndex` (radio-group-navigation.ts) and is covered by
 * co-located tests.
 *
 * Spec: docs/design-system/reference/components/forms/RadioGroup.jsx
 */
export function RadioGroup({ options, value, name, onChange, className }: Props) {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const disabledIndexes = new Set(
        options.flatMap((opt, i) => (opt.disabled ? [i] : [])),
    );

    function selectIndex(index: number) {
        const option = options[index];
        if (!option || option.disabled) return;
        onChange?.(option.value);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) {
        if (!isRadioGroupNavigationKey(e.key)) return;
        e.preventDefault();
        const nextIndex = getNextRadioGroupIndex(
            e.key,
            currentIndex,
            options.length,
            disabledIndexes,
        );
        if (nextIndex === null) return;
        selectIndex(nextIndex);
        setFocusedIndex(nextIndex);
        // Move real keyboard focus to the newly selected option, matching
        // native radio-group behavior, so subsequent arrow presses continue
        // from the new position rather than the one the user physically hit.
        inputRefs.current[nextIndex]?.focus();
    }

    return (
        <fieldset data-component="radio-group" className={`${styles.root} ${className ?? ""}`}>
            {options.map((opt, i) => (
                <span key={opt.value} className={styles.option}>
                    <input
                        ref={(el) => {
                            inputRefs.current[i] = el;
                        }}
                        className={styles.input}
                        type="radio"
                        name={name}
                        value={opt.value}
                        checked={opt.value === value}
                        disabled={opt.disabled}
                        onChange={() => selectIndex(i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onFocus={() => setFocusedIndex(i)}
                        onBlur={() =>
                            setFocusedIndex((current) => (current === i ? null : current))}
                        aria-label={opt.label}
                    />
                    <Chip
                        active={opt.value === value}
                        focused={focusedIndex === i}
                        hotkey={opt.hotkey}
                        disabled={opt.disabled}
                        tabIndex={-1}
                    >
                        {opt.label}
                    </Chip>
                </span>
            ))}
        </fieldset>
    );
}
