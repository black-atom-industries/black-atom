/**
 * Square-knob toggle, 38×22. Space toggles when row-focused.
 */
export interface ToggleProps {
    on?: boolean;
    disabled?: boolean;
    onChange?: () => void;
    style?: React.CSSProperties;
}
