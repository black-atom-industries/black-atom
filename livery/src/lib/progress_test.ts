import { assert, test } from "vitest";
import {
    activeThemePersistenceError,
    getFailedUpdaters,
    getProgressState,
    mergeUpdateResults,
    summarizeApply,
    themeWasApplied,
} from "./progress.ts";
import type { UpdateResult } from "./updaters.ts";

test("active theme persistence failures become visible error rows", () => {
    assert.deepEqual(activeThemePersistenceError(new Error("disk full")), {
        app: "config",
        status: "error",
        message: "Could not persist active theme: disk full",
        duration_ms: null,
    });
});

test("themeWasApplied counts patched reload skips but not no-op skips", () => {
    assert.deepEqual(
        themeWasApplied({
            app: "ghostty",
            status: "done",
            duration_ms: null,
        }),
        true,
    );
    assert.deepEqual(
        themeWasApplied({
            app: "ghostty",
            status: "skipped",
            message: "Config patched; live reload failed",
            duration_ms: null,
        }),
        true,
    );
    assert.deepEqual(
        themeWasApplied({
            app: "ghostty",
            status: "skipped",
            message: "App is disabled",
            duration_ms: null,
        }),
        false,
    );
});

test("getProgressState returns zero progress for empty results", () => {
    const state = getProgressState([]);
    assert.deepEqual(state, {
        completedCount: 0,
        total: 0,
        value: null,
        currentLabel: null,
        status: "idle",
        totalDurationMs: null,
    });
});

test("getProgressState calculates progress for mixed statuses", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "running", duration_ms: null },
        { app: "ghostty", status: "pending", duration_ms: null },
    ];
    const state = getProgressState(results);
    assert.deepEqual(state.completedCount, 1);
    assert.deepEqual(state.total, 3);
    assert.deepEqual(state.value, Math.round((1 / 3) * 100));
    assert.deepEqual(state.currentLabel, "tmux");
    assert.deepEqual(state.status, "running");
});

test("getProgressState reports done when all complete", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "done", duration_ms: null },
    ];
    const state = getProgressState(results);
    assert.deepEqual(state.completedCount, 2);
    assert.deepEqual(state.total, 2);
    assert.deepEqual(state.value, 100);
    assert.deepEqual(state.currentLabel, null);
    assert.deepEqual(state.status, "done");
});

test("getProgressState reports error when any app errored", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "done", duration_ms: null },
    ];
    const state = getProgressState(results);
    assert.deepEqual(state.completedCount, 3);
    assert.deepEqual(state.total, 3);
    assert.deepEqual(state.value, 100);
    assert.deepEqual(state.status, "error");
});

test("getProgressState counts skipped as completed", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "skipped", duration_ms: null },
        { app: "ghostty", status: "running", duration_ms: null },
    ];
    const state = getProgressState(results);
    assert.deepEqual(state.completedCount, 2);
    assert.deepEqual(state.total, 3);
});

test("getFailedUpdaters returns empty array when nothing errored", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "done", duration_ms: null },
    ];
    assert.deepEqual(getFailedUpdaters(results), []);
});

test("getFailedUpdaters returns app names with error status", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "error", message: "failed", duration_ms: null },
        { app: "obsidian", status: "skipped", duration_ms: null },
    ];
    assert.deepEqual(getFailedUpdaters(results), ["tmux", "ghostty"]);
});

test("getFailedUpdaters returns empty array for empty results", () => {
    assert.deepEqual(getFailedUpdaters([]), []);
});

test("mergeUpdateResults overlays updates onto matching app entries", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 10 },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "done", duration_ms: 5 },
    ];
    const updates: UpdateResult[] = [{ app: "tmux", status: "done", duration_ms: 8 }];
    const merged = mergeUpdateResults(results, updates);
    assert.deepEqual(merged, [
        { app: "nvim", status: "done", duration_ms: 10 },
        { app: "tmux", status: "done", duration_ms: 8 },
        { app: "ghostty", status: "done", duration_ms: 5 },
    ]);
});

test("summarizeApply reads empty results as running, never clean", () => {
    const summary = summarizeApply([]);
    assert.deepEqual(summary.kind, "running");
    assert.deepEqual(summary.total, 0);
});

test("summarizeApply stays running while any row is pending or running", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "running", duration_ms: null },
        { app: "ghostty", status: "pending", duration_ms: null },
    ];
    const summary = summarizeApply(results);
    assert.deepEqual(summary.kind, "running");
    assert.deepEqual(summary.completedCount, 1);
    assert.deepEqual(summary.totalDurationMs, 12);
});

test("summarizeApply reports clean when every row resolved without fault", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
    ];
    const summary = summarizeApply(results);
    assert.deepEqual(summary, {
        kind: "clean",
        okCount: 2,
        errorCount: 0,
        degradedCount: 0,
        completedCount: 2,
        total: 2,
        totalDurationMs: 20,
    });
});

test("summarizeApply reports error over degraded when both are present", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "ghostty", status: "skipped", message: "reload failed", duration_ms: 15 },
        { app: "obsidian", status: "error", message: "ENOENT", duration_ms: 3 },
    ];
    const summary = summarizeApply(results);
    assert.deepEqual(summary.kind, "error");
    assert.deepEqual(summary.okCount, 1);
    assert.deepEqual(summary.errorCount, 1);
    assert.deepEqual(summary.degradedCount, 1);
});

test("summarizeApply reports degraded for message-carrying skips without errors", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "ghostty", status: "skipped", message: "reload failed", duration_ms: 15 },
    ];
    const summary = summarizeApply(results);
    assert.deepEqual(summary.kind, "degraded");
    assert.deepEqual(summary.degradedCount, 1);
});

test("summarizeApply keeps a bare skip quiet (clean, counted ok)", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "skipped", duration_ms: null },
    ];
    const summary = summarizeApply(results);
    assert.deepEqual(summary.kind, "clean");
    assert.deepEqual(summary.okCount, 2);
});

test("mergeUpdateResults preserves original order and leaves unmatched entries untouched", () => {
    const results: UpdateResult[] = [
        { app: "a", status: "done", duration_ms: null },
        { app: "b", status: "done", duration_ms: null },
    ];
    const merged = mergeUpdateResults(results, []);
    assert.deepEqual(merged, results);
});
