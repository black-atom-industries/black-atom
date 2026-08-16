/**
 * Datasheet text field: mono label above, recessed 1px-bordered value.
 * All user input renders in monospace.
 */
export interface TextInputProps {
    /** Uppercase field label, e.g. "CONFIG_PATH". */
    label?: string;
    value?: string;
    placeholder?: string;
    /** Appends "· OPTIONAL" to the label. */
    optional?: boolean;
    /** Editing state: positive border, block caret, right-side hint. */
    editing?: boolean;
    /** Editing hint, e.g. "⏎ SAVE · esc REVERT". */
    hint?: string;
    style?: React.CSSProperties;
}
