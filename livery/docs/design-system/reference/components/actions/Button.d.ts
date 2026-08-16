/**
 * Actuator-style button. Bracket notation [ LABEL ] is the visual
 * signature for interactive elements. Mono uppercase, 0 radius.
 * @startingPoint section="Actions" subtitle="Bracket actuator — primary / secondary / ghost" viewport="700x120"
 */
export interface ButtonProps {
    /** Visual intent. primary = filled contrast, secondary = 1px strong border, ghost = text only. */
    intent?: "primary" | "secondary" | "ghost";
    disabled?: boolean;
    /** Single-key hotkey shown inside the brackets, tinted positive (e.g. "r"). */
    hotkey?: string;
    children: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
}
