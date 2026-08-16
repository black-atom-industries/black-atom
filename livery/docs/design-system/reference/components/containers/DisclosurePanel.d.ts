/**
 * Expandable bordered panel — the settings-row primitive (one per adapter).
 * @startingPoint section="Containers" subtitle="Adapter settings row, collapsed/expanded" viewport="700x160"
 */
export interface DisclosurePanelProps {
    expanded?: boolean;
    /** Header row content (Toggle, name, path, StatusPip…). The ⏎ EXPAND/COLLAPSE hint is added automatically. */
    header: React.ReactNode;
    /** Expanded body (field grid + actions). */
    children?: React.ReactNode;
    style?: React.CSSProperties;
}
