/**
 * App footer: full key vocabulary left, live status right.
 */
export interface AppFooterProps {
    /** Row of KeyHint elements. */
    hints: React.ReactNode;
    /** StatusPip, e.g. <StatusPip intent="ok">READY</StatusPip>. */
    status?: React.ReactNode;
    style?: React.CSSProperties;
}
