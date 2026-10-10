import { assert, test } from "vitest";
import { applyTheme, createUpdaters, getEnabledApps } from "./updaters.ts";
import type { AppConfig, AppName } from "../bindings.ts";
import type * as Theme from "@black-atom/core";
import type { UpdaterEntry, UpdateResult } from "./updaters.ts";

// --- getEnabledApps ---

test("getEnabledApps returns only enabled apps", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        ghostty: { enabled: true, config_path: "/ghostty" },
        nvim: { enabled: true, config_path: "/nvim" },
        tmux: { enabled: false, config_path: "/tmux" },
    };

    const result = getEnabledApps(apps);
    const names = result.map(([name]) => name);

    assert.deepEqual(names.includes("ghostty"), true);
    assert.deepEqual(names.includes("nvim"), true);
    assert.deepEqual(names.includes("tmux"), false);
});

test("getEnabledApps includes apps without backend updater (backend handles skipping)", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        zed: { enabled: true, config_path: "/zed" },
    };

    const result = getEnabledApps(apps);

    assert.deepEqual(result.length, 1);
    assert.deepEqual(result[0][0], "zed");
});

test("getEnabledApps returns empty for empty config", () => {
    const result = getEnabledApps({});

    assert.deepEqual(result.length, 0);
});

test("getEnabledApps preserves app config in result", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        ghostty: { enabled: true, config_path: "/my/ghostty", themes_path: "/themes" },
    };

    const result = getEnabledApps(apps);

    assert.deepEqual(result.length, 1);
    assert.deepEqual(result[0][0], "ghostty");
    assert.deepEqual(result[0][1].config_path, "/my/ghostty");
    assert.deepEqual(result[0][1].themes_path, "/themes");
});

// --- createUpdaters ---

test("createUpdaters creates an entry per enabled app", () => {
    const enabledApps: [AppName, AppConfig][] = [
        ["ghostty", { enabled: true, config_path: "/ghostty" }],
        ["nvim", { enabled: true, config_path: "/nvim" }],
    ];

    const themeMeta = {
        key: "black-atom-terra-fall-dark",
        name: "Fall Dark",
        appearance: "dark",
        status: "release",
        collection: { key: "terra", label: "Terra" },
    } as unknown as Theme.Meta;

    const result = createUpdaters(enabledApps, themeMeta);

    assert.deepEqual(result.length, 2);
    assert.deepEqual(result[0].app, "ghostty");
    assert.deepEqual(result[1].app, "nvim");
    assert.deepEqual(typeof result[0].run, "function");
    assert.deepEqual(typeof result[1].run, "function");
});

test("createUpdaters returns empty for empty input", () => {
    const themeMeta = {
        key: "any",
        name: "Any",
        appearance: "dark",
        status: "release",
        collection: { key: "default", label: "Default" },
    } as unknown as Theme.Meta;

    const result = createUpdaters([], themeMeta);

    assert.deepEqual(result.length, 0);
});

// --- applyTheme ---

test("applyTheme calls onUpdate with pending, running, and done states", async () => {
    const updates: UpdateResult[][] = [];

    const updaters: UpdaterEntry[] = [
        {
            app: "ghostty",
            run: () => Promise.resolve({ app: "ghostty", status: "done", duration_ms: null }),
        },
    ];

    await applyTheme(updaters, (results) => {
        updates.push([...results]);
    });

    // 1: pending, 2: running, 3: done
    assert.deepEqual(updates.length, 3);
    assert.deepEqual(updates[0][0].status, "pending");
    assert.deepEqual(updates[1][0].status, "running");
    assert.deepEqual(updates[2][0].status, "done");
});

test("applyTheme handles multiple updaters sequentially", async () => {
    const updates: UpdateResult[][] = [];

    const updaters: UpdaterEntry[] = [
        {
            app: "ghostty",
            run: () => Promise.resolve({ app: "ghostty", status: "done", duration_ms: null }),
        },
        {
            app: "nvim",
            run: () => Promise.resolve({ app: "nvim", status: "done", duration_ms: null }),
        },
    ];

    await applyTheme(updaters, (results) => {
        updates.push([...results]);
    });

    // 1: both pending
    // 2: ghostty running, nvim pending
    // 3: ghostty done, nvim pending
    // 4: ghostty done, nvim running
    // 5: ghostty done, nvim done
    assert.deepEqual(updates.length, 5);
    assert.deepEqual(updates[0][0].status, "pending");
    assert.deepEqual(updates[0][1].status, "pending");
    assert.deepEqual(updates[4][0].status, "done");
    assert.deepEqual(updates[4][1].status, "done");
});

test("applyTheme propagates error status from failed updater", async () => {
    const updates: UpdateResult[][] = [];

    const updaters: UpdaterEntry[] = [
        {
            app: "ghostty",
            run: () =>
                Promise.resolve({
                    app: "ghostty",
                    status: "error",
                    message: "file not found",
                    duration_ms: null,
                }),
        },
    ];

    await applyTheme(updaters, (results) => {
        updates.push([...results]);
    });

    assert.deepEqual(updates[2][0].status, "error");
    assert.deepEqual(updates[2][0].message, "file not found");
});

test("applyTheme returns the settled results", async () => {
    const updaters: UpdaterEntry[] = [
        {
            app: "ghostty",
            run: () => Promise.resolve({ app: "ghostty", status: "done", duration_ms: 3 }),
        },
        {
            app: "nvim",
            run: () => Promise.resolve({ app: "nvim", status: "skipped", duration_ms: null }),
        },
    ];

    const results = await applyTheme(updaters, () => {});

    assert.deepEqual(results.map((result) => result.status), ["done", "skipped"]);
});

// The Active Theme record follows what actually got written, so a run that
// only skipped or errored must leave the previous record standing.
test("applyTheme returns no done results when nothing was written", async () => {
    const updaters: UpdaterEntry[] = [
        {
            app: "ghostty",
            run: () => Promise.resolve({ app: "ghostty", status: "skipped", duration_ms: null }),
        },
        {
            app: "nvim",
            run: () =>
                Promise.resolve({
                    app: "nvim",
                    status: "error",
                    message: "boom",
                    duration_ms: null,
                }),
        },
    ];

    const results = await applyTheme(updaters, () => {});

    assert.deepEqual(results.filter((result) => result.status === "done").length, 0);
});
