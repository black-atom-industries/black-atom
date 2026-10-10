import { assert, test } from "vitest";
import type { AppPathVerification, LinkThemesResult } from "../bindings.ts";
import { setUpAdapter, type SetUpDeps } from "./adapter-setup.ts";

function fakeDeps(overrides: Partial<SetUpDeps> = {}) {
    const calls: string[] = [];
    const link: LinkThemesResult = {
        app: "ghostty",
        status: "done",
        linked: 12,
        pruned: 0,
    };
    const verify: AppPathVerification = {
        app: "ghostty",
        exists: true,
        pattern_matches: true,
    };
    const deps: SetUpDeps = {
        enable: (app) => {
            calls.push(`enable:${app}`);
            return Promise.resolve();
        },
        link: (app) => {
            calls.push(`link:${app}`);
            return Promise.resolve(link);
        },
        verify: (app) => {
            calls.push(`verify:${app}`);
            return Promise.resolve(verify);
        },
        ...overrides,
    };
    return { deps, calls };
}

test("linked runs the full chain in order and ends ok", async () => {
    const { deps, calls } = fakeDeps();
    const outcome = await setUpAdapter("ghostty", "linked", "~/.config/ghostty/config", deps);

    assert.deepEqual(calls, ["enable:ghostty", "link:ghostty", "verify:ghostty"]);
    assert(outcome.steps.every((s) => s.status === "ok"));
    assert.deepEqual(outcome.blocked, null);
    assert(outcome.verify?.exists);
});

test("external skips link", async () => {
    const { deps, calls } = fakeDeps();
    const outcome = await setUpAdapter("delta", "external", "~/.config/delta/config.ini", deps);

    assert.deepEqual(calls, ["enable:delta", "verify:delta"]);
    assert.deepEqual(
        outcome.steps.map((s) => s.step),
        ["enable", "verify"],
    );
});

test("merged reads the unpacked files directly and never links", async () => {
    const { deps, calls } = fakeDeps();
    await setUpAdapter("lazygit", "merged", "~/.config/lazygit/config.yml", deps);

    assert.deepEqual(calls, ["enable:lazygit", "verify:lazygit"]);
});

test("empty config_path blocks the chain before any call", async () => {
    const { deps, calls } = fakeDeps();
    const outcome = await setUpAdapter("obsidian", "linked", "", deps);

    assert.deepEqual(calls, []);
    assert.deepEqual(outcome.steps, []);
    assert(outcome.blocked?.includes("config folder"));
});

test("failed link surfaces its reason but still verifies", async () => {
    const { deps, calls } = fakeDeps({
        link: () =>
            Promise.resolve({
                app: "ghostty",
                status: "error",
                message: "themes directory is missing",
                linked: null,
                pruned: null,
            }),
    });
    const outcome = await setUpAdapter("ghostty", "linked", "~/.config/ghostty/config", deps);

    // The overridden link dep records nothing — verify must still run.
    assert.deepEqual(calls, ["enable:ghostty", "verify:ghostty"]);
    const byStep = Object.fromEntries(outcome.steps.map((s) => [s.step, s]));
    assert.deepEqual(byStep.link.status, "error");
    assert.deepEqual(byStep.link.message, "themes directory is missing");
    assert.deepEqual(byStep.verify.status, "ok");
});

test("failed enable aborts the chain", async () => {
    const { deps, calls } = fakeDeps({
        enable: () => Promise.reject(new Error("config write failed")),
    });
    const outcome = await setUpAdapter("ghostty", "linked", "~/.config/ghostty/config", deps);

    assert.deepEqual(calls, []);
    const byStep = Object.fromEntries(outcome.steps.map((s) => [s.step, s]));
    assert.deepEqual(byStep.enable.status, "error");
    assert(outcome.steps.filter((s) => s.step !== "enable").every((s) => s.status === "skipped"));
    assert.deepEqual(outcome.verify, null);
});

test("verify fault surfaces as an error step with the reason", async () => {
    const { deps } = fakeDeps({
        verify: () => Promise.resolve({ app: "ghostty", exists: true, pattern_matches: false }),
    });
    const outcome = await setUpAdapter("ghostty", "external", "~/.config/ghostty/config", deps);

    const verifyStep = outcome.steps.find((s) => s.step === "verify");
    assert.deepEqual(verifyStep?.status, "error");
    assert.deepEqual(verifyStep?.message, "no pattern match");
});

test("onUpdate reports running before each step resolves", async () => {
    const { deps } = fakeDeps();
    const seen: string[] = [];
    await setUpAdapter("ghostty", "linked", "~/.config/ghostty/config", deps, (outcome) => {
        const running = outcome.steps.find((s) => s.status === "running");
        if (running) seen.push(running.step);
    });
    assert.deepEqual(seen, ["enable", "link", "verify"]);
});
