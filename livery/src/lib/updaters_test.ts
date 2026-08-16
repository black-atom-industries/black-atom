import { assertEquals } from "@std/assert";
import { applyTheme, createUpdaters, getEnabledApps } from "./updaters.ts";
import type { AppConfig, AppName } from "../bindings.ts";
import type { ThemeMeta } from "@black-atom/core";
import type { UpdaterEntry, UpdateResult } from "./updaters.ts";

// --- getEnabledApps ---

Deno.test("getEnabledApps returns only enabled apps", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        ghostty: { enabled: true, config_path: "/ghostty" },
        nvim: { enabled: true, config_path: "/nvim" },
        tmux: { enabled: false, config_path: "/tmux" },
    };

    const result = getEnabledApps(apps);
    const names = result.map(([name]) => name);

    assertEquals(names.includes("ghostty"), true);
    assertEquals(names.includes("nvim"), true);
    assertEquals(names.includes("tmux"), false);
});

Deno.test("getEnabledApps includes apps without backend updater (backend handles skipping)", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        zed: { enabled: true, config_path: "/zed" },
    };

    const result = getEnabledApps(apps);

    assertEquals(result.length, 1);
    assertEquals(result[0][0], "zed");
});

Deno.test("getEnabledApps returns empty for empty config", () => {
    const result = getEnabledApps({});

    assertEquals(result.length, 0);
});

Deno.test("getEnabledApps preserves app config in result", () => {
    const apps: Partial<Record<AppName, AppConfig>> = {
        ghostty: { enabled: true, config_path: "/my/ghostty", themes_path: "/themes" },
    };

    const result = getEnabledApps(apps);

    assertEquals(result.length, 1);
    assertEquals(result[0][0], "ghostty");
    assertEquals(result[0][1].config_path, "/my/ghostty");
    assertEquals(result[0][1].themes_path, "/themes");
});

// --- createUpdaters ---

Deno.test("createUpdaters creates an entry per enabled app", () => {
    const enabledApps: [AppName, AppConfig][] = [
        ["ghostty", { enabled: true, config_path: "/ghostty" }],
        ["nvim", { enabled: true, config_path: "/nvim" }],
    ];

    const themeMeta = {
        key: "black-atom-terra-fall-night",
        name: "Fall Night",
        appearance: "dark",
        status: "release",
        collection: { key: "terra", label: "Terra" },
    } as unknown as ThemeMeta;

    const result = createUpdaters(enabledApps, themeMeta);

    assertEquals(result.length, 2);
    assertEquals(result[0].app, "ghostty");
    assertEquals(result[1].app, "nvim");
    assertEquals(typeof result[0].run, "function");
    assertEquals(typeof result[1].run, "function");
});

Deno.test("createUpdaters returns empty for empty input", () => {
    const themeMeta = {
        key: "any",
        name: "Any",
        appearance: "dark",
        status: "release",
        collection: { key: "default", label: "Default" },
    } as unknown as ThemeMeta;

    const result = createUpdaters([], themeMeta);

    assertEquals(result.length, 0);
});

// --- applyTheme ---

Deno.test("applyTheme calls onUpdate with pending, running, and done states", async () => {
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
    assertEquals(updates.length, 3);
    assertEquals(updates[0][0].status, "pending");
    assertEquals(updates[1][0].status, "running");
    assertEquals(updates[2][0].status, "done");
});

Deno.test("applyTheme handles multiple updaters sequentially", async () => {
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
    assertEquals(updates.length, 5);
    assertEquals(updates[0][0].status, "pending");
    assertEquals(updates[0][1].status, "pending");
    assertEquals(updates[4][0].status, "done");
    assertEquals(updates[4][1].status, "done");
});

Deno.test("applyTheme propagates error status from failed updater", async () => {
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

    assertEquals(updates[2][0].status, "error");
    assertEquals(updates[2][0].message, "file not found");
});
