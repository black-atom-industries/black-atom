/**
 * Keyboard-list row. Selection = hint bg + 2px positive left edge + › cursor.
 * @startingPoint section="Display" subtitle="Theme list row with palette pips" viewport="700x120"
 */
export interface ListRowProps {
    selected?: boolean;
    /** Dimmed-not-hidden (filtered out by query). */
    dimmed?: boolean;
    name: string;
    /** Mini palette pip colors (4). */
    pips?: string[];
    /** Appearance letter: "D" | "L". */
    appearance?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
}
