import { cva, type VariantProps } from "cva";
import { StatusPip } from "../status-pip/status-pip.tsx";
import { KVRow } from "../kv-row/kv-row.tsx";
import { Button } from "../button/button.tsx";
import styles from "./adapter-status-row.module.css";

export const adapterStatusRowVariants = cva({
    base: styles.root,
    variants: {
        status: {
            pending: styles.statusPending,
            running: styles.statusRunning,
            ok: styles.statusOk,
            warn: styles.statusWarn,
            error: styles.statusError,
        },
        cursored: {
            true: styles.cursored,
        },
    },
    defaultVariants: {
        status: "pending",
    },
});

export type AdapterRowStatus = NonNullable<
    VariantProps<typeof adapterStatusRowVariants>["status"]
>;

type Props = {
    /** Adapter key, lowercased, e.g. "ghostty", "nvim". */
    name: string;
    /** Drives the StatusPip and the row's affordances. */
    status: AdapterRowStatus;
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
    /** j/k cursor is on this row: subtle fill + 2px intent-tinted left edge. */
    cursored?: boolean;
    /** Error row is expanded (⏎ / click). Only meaningful when status="error". */
    expanded?: boolean;
    /** Toggle expansion (⏎ or click on an error row). */
    onToggle?: () => void;
    /** Re-run only this adapter — the [ r RETRY FAILED ] actuator. */
    onRetry?: () => void;
    className?: string;
    /** Per-instance CSS vars (e.g. `--i` for the rail's verdict cascade). */
    style?: React.CSSProperties;
};

/**
 * One adapter's line in the ApplyRail — pip + mono name + right-aligned
 * tabular duration. `warn` (DEGRADED) previews its reason on a second line;
 * an `error` row expands in place (no overlay) into a recessed detail block
 * with message, PATH/CODE KVRows and a retry actuator.
 *
 * Spec: docs/design-system/reference/components/display/AdapterStatusRow.jsx
 * Board: docs/design-system/reference/Livery Explorations.dc.html#3f
 */
export function AdapterStatusRow({
    name,
    status,
    durationMs,
    message,
    path,
    code,
    cursored,
    expanded,
    onToggle,
    onRetry,
    className,
    style,
}: Props) {
    const duration = status === "ok" && durationMs != null ? `${durationMs}ms` : "—";

    return (
        <>
            <div
                data-component="adapter-status-row"
                data-status={status}
                className={adapterStatusRowVariants({ status, cursored, className })}
                style={style}
                onClick={status === "error" ? onToggle : undefined}
            >
                <div className={styles.line}>
                    <StatusPip intent={status} />
                    <span className={styles.name}>
                        {name}
                        {status === "running" ? " ▶" : ""}
                    </span>
                    {status === "error"
                        ? <span className={styles.tag}>ERR</span>
                        : status === "warn"
                        ? <span className={styles.tag}>DEGRADED</span>
                        : <span className={styles.duration}>{duration}</span>}
                </div>
                {status === "warn" && message && <span className={styles.reason}>{message}</span>}
            </div>
            {status === "error" && expanded && (
                <div className={styles.detail}>
                    {message && <p className={styles.detailMessage}>{message}</p>}
                    {(path || code) && (
                        <div className={styles.detailRows}>
                            {path && <KVRow label="PATH">{path}</KVRow>}
                            {code && <KVRow label="CODE" intent="negative">{code}</KVRow>}
                        </div>
                    )}
                    {onRetry && (
                        <Button hotkey="r" onClick={onRetry} className={styles.retry}>
                            RETRY FAILED
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
