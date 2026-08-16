/**
 * Square status pip (8px) + mono label. The only status iconography.
 */
export interface StatusPipProps {
    intent?: "ok" | "running" | "pending" | "warn" | "error" | "off";
    /** Label, e.g. "SYNCED 8/8", "nvim". Omit for pip-only. */
    children?: React.ReactNode;
    style?: React.CSSProperties;
}
