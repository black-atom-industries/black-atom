/**
 * Keyboard-hint atom for footers and dialogs: "j/k NAVIGATE".
 */
export interface KeyHintProps {
    /** The key(s), e.g. "j/k", "⏎", "esc". */
    keys: string;
    /** The action label, uppercase, e.g. "NAVIGATE". */
    children: React.ReactNode;
    style?: React.CSSProperties;
}
