/**
 * Segmented single-choice control (chips, exactly one active).
 */
export interface RadioGroupProps {
    options: { value: string; label: string; hotkey?: string }[];
    value: string;
    onChange?: (value: string) => void;
    style?: React.CSSProperties;
}
