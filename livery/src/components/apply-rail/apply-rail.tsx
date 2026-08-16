import type { UpdateResult } from "../../lib/updaters.ts";
import { summarizeApply } from "../../lib/progress.ts";
import {
    type AdapterRowStatus,
    AdapterStatusRow,
} from "../primitives/adapter-status-row/adapter-status-row.tsx";
import styles from "./apply-rail.module.css";

/**
 * UpdateResult → row status. A skip carrying a message is a degraded result
 * (e.g. "config patched, live reload failed") — it must read as attention,
 * never as silence. A bare skip stays quiet.
 */
export function toAdapterRowStatus(result: UpdateResult): AdapterRowStatus {
    switch (result.status) {
        case "done":
            return "ok";
        case "skipped":
            return result.message ? "warn" : "ok";
        case "error":
            return "error";
        case "pending":
            return "pending";
        case "running":
            return "running";
    }
}

/**
 * The rail is permanently docked; `mode` says who owns the keyboard:
 * - "idle": nothing applied yet — enabled adapters preview as pending rows
 * - "active": an apply ran, the rail owns j/k/⏎/esc
 * - "settled": esc (or the clean beat) handed the keys back to the list;
 *   the last results stay on display
 */
export type ApplyRailMode = "idle" | "active" | "settled";

interface ApplyRailProps {
    mode: ApplyRailMode;
    /** Theme name shown in the register line, e.g. "KOYO YORU". */
    themeName: string;
    /** Updater results in run order — one AdapterStatusRow each. */
    results: UpdateResult[];
    /** App under the j/k cursor, or null for no cursor. */
    cursorApp?: UpdateResult["app"] | null;
    /** Error row currently expanded in place, or null. */
    expandedApp?: UpdateResult["app"] | null;
    /** ⏎ / click on an error row. */
    onToggleRow?: (app: UpdateResult["app"]) => void;
    /** Re-runs only the failed updaters. Omit to hide the retry action. */
    onRetryFailed?: () => void;
}

/**
 * Apply Rail — permanently docked right aside (280px, hard 1px seam), the
 * ApplyStrip's successor. Register header (status line + n/m + total ms +
 * 3px track), one AdapterStatusRow per updater in run order, and the rail's
 * key vocabulary as its footer. Idle previews the enabled adapters; after
 * an apply the results stay on display, only keyboard ownership moves.
 *
 * Purely presentational: cursor, expansion, hotkeys and phase handoff live
 * in the app-layout container.
 *
 * Spec: docs/design-system/reference/Livery Explorations.dc.html#3f
 * (deviation per design review 2026-07-05: never hidden, no auto-collapse)
 */
export function ApplyRail({
    mode,
    themeName,
    results,
    cursorApp,
    expandedApp,
    onToggleRow,
    onRetryFailed,
}: ApplyRailProps) {
    const summary = summarizeApply(results);
    const { kind, okCount, errorCount, degradedCount, completedCount, total, totalDurationMs } =
        summary;

    const statusLine = mode === "idle"
        ? "READY"
        : kind === "running"
        ? `APPLYING ${themeName}`
        : kind === "clean"
        ? `■ APPLIED — ${themeName}`
        : kind === "degraded"
        ? `■ APPLIED · ${degradedCount} DEGRADED`
        : "■ APPLIED WITH ERRORS";

    const counterLeft = mode === "idle" || kind === "running"
        ? `${completedCount}/${total}`
        : `${okCount + degradedCount}/${total} OK`;

    const counterRight = kind === "error"
        ? `${errorCount} ERROR`
        : totalDurationMs != null
        ? `${totalDurationMs} MS`
        : "";

    const progressValue = mode !== "idle" && total > 0
        ? Math.round((completedCount / total) * 100)
        : 0;

    const vocabulary = mode !== "active"
        ? "⏎ APPLY"
        : kind === "clean"
        ? "esc BACK · auto in 1.2s"
        : `j/k ROWS · ⏎ ${expandedApp ? "COLLAPSE" : "DETAILS"} · r RETRY · esc BACK`;

    return (
        <div
            data-component="apply-rail"
            data-kind={mode === "idle" ? "idle" : kind}
            className={styles.root}
        >
            <div className={styles.header}>
                <span className={styles.statusLine}>{statusLine}</span>
                <div className={styles.counters}>
                    <span>{counterLeft}</span>
                    <span>{counterRight}</span>
                </div>
                {/* A fault header carries no track — the counter is the verdict. */}
                {kind !== "error" && (
                    <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${progressValue}%` }} />
                    </div>
                )}
            </div>
            {
                /* data-live scopes the resolve/blink animations to a running pass —
                rows never flash on mount or in settled/idle display. */
            }
            <div className={styles.rows} data-live={mode === "active"}>
                {results.map((result, index) => (
                    <AdapterStatusRow
                        key={result.app}
                        name={result.app}
                        status={toAdapterRowStatus(result)}
                        durationMs={result.duration_ms}
                        message={result.message}
                        cursored={cursorApp === result.app}
                        expanded={expandedApp === result.app}
                        onToggle={onToggleRow ? () => onToggleRow(result.app) : undefined}
                        onRetry={onRetryFailed}
                        style={{ "--i": index } as React.CSSProperties}
                    />
                ))}
            </div>
            <div className={styles.vocabulary}>{vocabulary}</div>
        </div>
    );
}
