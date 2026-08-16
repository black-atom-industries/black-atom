/**
 * One adapter's line in the ApplyRail (see Livery Explorations.dc.html#3f).
 * Pip + mono name + right-aligned duration; an error row expands in place
 * into a detail block (message, path, retry). Rows render in run order.
 */
export interface AdapterStatusRowProps {
    /** Adapter key, lowercased, e.g. "ghostty", "nvim". */
    name: string;
    /** Drives the StatusPip and the row's affordances. */
    status: "pending" | "running" | "ok" | "warn" | "error";
    /** Per-adapter apply time in ms. Omit while pending/running (renders "—"). */
    durationMs?: number | null;
    /**
     * One-line reason. On "warn" (DEGRADED) it previews in hint fg, truncated.
     * On "error" it is the full message shown inside the expanded detail block.
     */
    message?: string | null;
    /** Absolute/tilde path the fault concerns — rendered as a KVRow when expanded. */
    path?: string | null;
    /** Error code, e.g. "LVR-102". Shown as a KVRow when expanded. */
    code?: string | null;
    /** j/k cursor is on this row: subtle fill + 2px positive left edge. */
    cursored?: boolean;
    /** Error row is expanded (⏎ / click). Only meaningful when status="error". */
    expanded?: boolean;
    /** Toggle expansion (⏎ or click on an error row). */
    onToggle?: () => void;
    /** Re-run only this adapter — the [ r RETRY FAILED ] actuator. */
    onRetry?: () => void;
    style?: React.CSSProperties;
}
