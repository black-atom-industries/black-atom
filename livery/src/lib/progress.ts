import type { UpdateResult } from "./updaters.ts";

export const ACTIVE_THEME_PERSISTENCE_APP = "config";
export const SYSTEM_APPEARANCE_APP = "system_appearance";

export function commandErrorResult(app: string, error: unknown): UpdateResult {
    const detail = error instanceof Error ? error.message : String(error);
    return {
        app,
        status: "error",
        message: detail,
        duration_ms: null,
    };
}

export function activeThemePersistenceError(error: unknown): UpdateResult {
    const detail = error instanceof Error ? error.message : String(error);
    return {
        app: ACTIVE_THEME_PERSISTENCE_APP,
        status: "error",
        message: `Could not persist active theme: ${detail}`,
        duration_ms: null,
    };
}

/** A done result or a config patch that only failed to reload live. */
export function themeWasApplied(result: UpdateResult): boolean {
    return (
        result.status === "done" ||
        (result.status === "skipped" && result.message?.startsWith("Config patched;") === true)
    );
}

export type ProgressStatus = "idle" | "running" | "done" | "error";

export interface ProgressState {
    completedCount: number;
    total: number;
    /** 0-100 percentage, or null when there are no results (indeterminate). */
    value: number | null;
    /** Name of the currently running app, or null if none running. */
    currentLabel: string | null;
    /** Aggregate status: idle (no results), running, done, or error. */
    status: ProgressStatus;
    /** Sum of duration_ms across all completed updaters, or null if none finished yet. */
    totalDurationMs: number | null;
}

const COMPLETED_STATUSES = new Set(["done", "skipped", "error"]);

/** Names of updaters currently in the "error" status — the retry candidates. */
export function getFailedUpdaters(results: UpdateResult[]): UpdateResult["app"][] {
    return results.filter((r) => r.status === "error").map((r) => r.app);
}

/**
 * Overlay a subset of updated results onto the full result set, matching by
 * app name and preserving the original ordering. Used to fold a retry pass
 * (run on failed updaters only) back into the full apply results.
 */
export function mergeUpdateResults(
    results: UpdateResult[],
    updates: UpdateResult[],
): UpdateResult[] {
    const updatesByApp = new Map(updates.map((u) => [u.app, u]));
    return results.map((r) => updatesByApp.get(r.app) ?? r);
}

export type ApplySummaryKind = "running" | "clean" | "degraded" | "error";

export interface ApplySummary {
    /**
     * Resolution class of the whole apply pass. "clean" auto-dismisses the
     * rail; "degraded" and "error" persist — a fault needs a decision.
     */
    kind: ApplySummaryKind;
    /** Rows that completed without fault (done, or a bare quiet skip). */
    okCount: number;
    errorCount: number;
    /** Skips carrying a message — applied-but-attention results (e.g. reload failed). */
    degradedCount: number;
    completedCount: number;
    total: number;
    totalDurationMs: number | null;
}

/**
 * Classify a full apply pass for the ApplyRail: still running, clean,
 * degraded (skips with a message), or error. Empty results read as
 * "running" so an apply that hasn't produced rows yet never auto-dismisses.
 */
export function summarizeApply(results: UpdateResult[]): ApplySummary {
    const total = results.length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const degradedCount = results.filter((r) => r.status === "skipped" && r.message).length;
    const completedCount = results.filter((r) => COMPLETED_STATUSES.has(r.status)).length;
    const okCount = completedCount - errorCount - degradedCount;
    const inFlight = total === 0 || completedCount < total;

    const kind: ApplySummaryKind = inFlight
        ? "running"
        : errorCount > 0
          ? "error"
          : degradedCount > 0
            ? "degraded"
            : "clean";

    const totalDurationMs = results.reduce<number | null>((sum, r) => {
        if (r.duration_ms != null) return (sum ?? 0) + r.duration_ms;
        return sum;
    }, null);

    return { kind, okCount, errorCount, degradedCount, completedCount, total, totalDurationMs };
}

export function getProgressState(results: UpdateResult[]): ProgressState {
    if (results.length === 0) {
        return {
            completedCount: 0,
            total: 0,
            value: null,
            currentLabel: null,
            status: "idle",
            totalDurationMs: null,
        };
    }

    const total = results.length;
    const completedCount = results.filter((r) => COMPLETED_STATUSES.has(r.status)).length;
    const value = Math.round((completedCount / total) * 100);
    const running = results.find((r) => r.status === "running");
    const hasError = results.some((r) => r.status === "error");

    let status: ProgressStatus;
    if (running) {
        status = "running";
    } else if (completedCount === total && hasError) {
        status = "error";
    } else if (completedCount === total) {
        status = "done";
    } else {
        status = "running";
    }

    const totalDurationMs = results.reduce<number | null>((sum, r) => {
        if (r.duration_ms != null) return (sum ?? 0) + r.duration_ms;
        return sum;
    }, null);

    return {
        completedCount,
        total,
        value,
        currentLabel: running?.app ?? null,
        status,
        totalDurationMs,
    };
}
