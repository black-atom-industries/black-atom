import { assertEquals } from "@std/assert";
import {
    getFailedUpdaters,
    getProgressState,
    mergeUpdateResults,
    summarizeApply,
} from "./progress.ts";
import type { UpdateResult } from "./updaters.ts";

Deno.test("getProgressState returns zero progress for empty results", () => {
    const state = getProgressState([]);
    assertEquals(state, {
        completedCount: 0,
        total: 0,
        value: null,
        currentLabel: null,
        status: "idle",
        totalDurationMs: null,
    });
});

Deno.test("getProgressState calculates progress for mixed statuses", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "running", duration_ms: null },
        { app: "ghostty", status: "pending", duration_ms: null },
    ];
    const state = getProgressState(results);
    assertEquals(state.completedCount, 1);
    assertEquals(state.total, 3);
    assertEquals(state.value, Math.round((1 / 3) * 100));
    assertEquals(state.currentLabel, "tmux");
    assertEquals(state.status, "running");
});

Deno.test("getProgressState reports done when all complete", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "done", duration_ms: null },
    ];
    const state = getProgressState(results);
    assertEquals(state.completedCount, 2);
    assertEquals(state.total, 2);
    assertEquals(state.value, 100);
    assertEquals(state.currentLabel, null);
    assertEquals(state.status, "done");
});

Deno.test("getProgressState reports error when any app errored", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "done", duration_ms: null },
    ];
    const state = getProgressState(results);
    assertEquals(state.completedCount, 3);
    assertEquals(state.total, 3);
    assertEquals(state.value, 100);
    assertEquals(state.status, "error");
});

Deno.test("getProgressState counts skipped as completed", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "skipped", duration_ms: null },
        { app: "ghostty", status: "running", duration_ms: null },
    ];
    const state = getProgressState(results);
    assertEquals(state.completedCount, 2);
    assertEquals(state.total, 3);
});

Deno.test("getFailedUpdaters returns empty array when nothing errored", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "done", duration_ms: null },
    ];
    assertEquals(getFailedUpdaters(results), []);
});

Deno.test("getFailedUpdaters returns app names with error status", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: null },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "error", message: "failed", duration_ms: null },
        { app: "obsidian", status: "skipped", duration_ms: null },
    ];
    assertEquals(getFailedUpdaters(results), ["tmux", "ghostty"]);
});

Deno.test("getFailedUpdaters returns empty array for empty results", () => {
    assertEquals(getFailedUpdaters([]), []);
});

Deno.test("mergeUpdateResults overlays updates onto matching app entries", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 10 },
        { app: "tmux", status: "error", message: "failed", duration_ms: null },
        { app: "ghostty", status: "done", duration_ms: 5 },
    ];
    const updates: UpdateResult[] = [
        { app: "tmux", status: "done", duration_ms: 8 },
    ];
    const merged = mergeUpdateResults(results, updates);
    assertEquals(merged, [
        { app: "nvim", status: "done", duration_ms: 10 },
        { app: "tmux", status: "done", duration_ms: 8 },
        { app: "ghostty", status: "done", duration_ms: 5 },
    ]);
});

Deno.test("summarizeApply reads empty results as running, never clean", () => {
    const summary = summarizeApply([]);
    assertEquals(summary.kind, "running");
    assertEquals(summary.total, 0);
});

Deno.test("summarizeApply stays running while any row is pending or running", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "running", duration_ms: null },
        { app: "ghostty", status: "pending", duration_ms: null },
    ];
    const summary = summarizeApply(results);
    assertEquals(summary.kind, "running");
    assertEquals(summary.completedCount, 1);
    assertEquals(summary.totalDurationMs, 12);
});

Deno.test("summarizeApply reports clean when every row resolved without fault", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
    ];
    const summary = summarizeApply(results);
    assertEquals(summary, {
        kind: "clean",
        okCount: 2,
        errorCount: 0,
        degradedCount: 0,
        completedCount: 2,
        total: 2,
        totalDurationMs: 20,
    });
});

Deno.test("summarizeApply reports error over degraded when both are present", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "ghostty", status: "skipped", message: "reload failed", duration_ms: 15 },
        { app: "obsidian", status: "error", message: "ENOENT", duration_ms: 3 },
    ];
    const summary = summarizeApply(results);
    assertEquals(summary.kind, "error");
    assertEquals(summary.okCount, 1);
    assertEquals(summary.errorCount, 1);
    assertEquals(summary.degradedCount, 1);
});

Deno.test("summarizeApply reports degraded for message-carrying skips without errors", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "ghostty", status: "skipped", message: "reload failed", duration_ms: 15 },
    ];
    const summary = summarizeApply(results);
    assertEquals(summary.kind, "degraded");
    assertEquals(summary.degradedCount, 1);
});

Deno.test("summarizeApply keeps a bare skip quiet (clean, counted ok)", () => {
    const results: UpdateResult[] = [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "skipped", duration_ms: null },
    ];
    const summary = summarizeApply(results);
    assertEquals(summary.kind, "clean");
    assertEquals(summary.okCount, 2);
});

Deno.test("mergeUpdateResults preserves original order and leaves unmatched entries untouched", () => {
    const results: UpdateResult[] = [
        { app: "a", status: "done", duration_ms: null },
        { app: "b", status: "done", duration_ms: null },
    ];
    const merged = mergeUpdateResults(results, []);
    assertEquals(merged, results);
});
