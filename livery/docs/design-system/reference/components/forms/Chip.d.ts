/**
 * Filter chip: clickable AND keyboard-addressable (hotkey slot).
 */
export interface ChipProps {
    /** Active = full contrast inversion. */
    active?: boolean;
    /** Keyboard focus: positive outline at 2px offset. */
    focused?: boolean;
    /** Hotkey shown before the label, e.g. "3". */
    hotkey?: string;
    children: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
}
