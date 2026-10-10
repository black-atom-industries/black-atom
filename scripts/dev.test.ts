import { test } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { readlinkSync, statSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readlink, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { strict as assert } from "node:assert";
import { createDevCycle, isCliInput } from "./dev-cycle.ts";

function output(
    command: string,
    { args = [], env = {} }: { args?: string[]; env?: Record<string, string> } = {},
) {
    return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(command, args, { env: { ...process.env, ...env } });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => (stdout += chunk));
        child.stderr.on("data", (chunk) => (stderr += chunk));
        child.once("error", reject);
        child.once("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
}

test("CLI inputs exclude GUI, docs and temporary files", () => {
    for (const path of [
        "livery/cli/src/main.rs",
        "livery/core/Cargo.toml",
        "Cargo.lock",
        "adapters/ghostty/themes/test.toml",
        "adapters/nvim/lua/new.lua",
        "adapters/obsidian/theme.css",
    ])
        assert.equal(isCliInput(path), true, path);
    for (const path of [
        "livery/src/app.css",
        "livery/src-tauri/src/lib.rs",
        "README.md",
        "target/debug/livery",
        "livery/cli/src/main.rs~",
    ])
        assert.equal(isCliInput(path), false, path);
});

test("readiness closes immediately and failed generation never builds stale CLI", async () => {
    const states: string[] = [];
    let builds = 0;
    let fail = false;
    const cycle = createDevCycle({
        generate: () => (fail ? Promise.reject(new Error("invalid theme")) : Promise.resolve()),
        build: () => {
            builds++;
            return Promise.resolve();
        },
        reapply: () => Promise.resolve(),
        state: (value) => states.push(value),
        isGenerationInput: (path) => path.endsWith("theme.ts"),
        debounceMs: 10_000,
    });
    cycle.schedule("theme.ts");
    assert.equal(states.at(-1), "pending");
    await cycle.flush();
    assert.equal(states.at(-1), "ready");
    fail = true;
    cycle.schedule("theme.ts");
    assert.equal(states.at(-1), "pending");
    await cycle.flush();
    assert.equal(builds, 1);
    assert.match(states.at(-1)!, /invalid theme/);
    cycle.stop();
});

test("input during build prevents stale reapply or readiness and builds serially", async () => {
    const gate = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    const states: string[] = [];
    let builds = 0;
    let reapplies = 0;
    const cycle = createDevCycle({
        generate: () => Promise.resolve(),
        build: async () => {
            if (++builds === 1) {
                started.resolve();
                await gate.promise;
            }
        },
        reapply: () => {
            reapplies++;
            return Promise.resolve();
        },
        state: (value) => states.push(value),
        isGenerationInput: () => false,
        debounceMs: 10_000,
    });
    cycle.schedule("main.rs");
    const flushing = cycle.flush();
    await started.promise;
    assert.equal(states.at(-1), "building");
    cycle.schedule("lib.rs");
    gate.resolve();
    await flushing;
    assert.equal(builds, 2);
    assert.equal(reapplies, 1);
    assert.equal(states.filter((value) => value === "ready").length, 1);
    cycle.stop();
});

import { createDevEnvironment } from "./dev-environment.ts";
import { launchDev } from "./dev-launcher.ts";
import { startDevProcess } from "./dev-process.ts";

async function withEnvironment(
    values: Record<string, string | undefined>,
    run: () => Promise<void>,
) {
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
    function apply(environment: Record<string, string | undefined>) {
        for (const [key, value] of Object.entries(environment)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
    apply(values);
    try {
        await run();
    } finally {
        apply(previous);
    }
}

test("launcher preserves inherited home, existing config, arguments and readiness", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const binary = `${fixture}/cli`;
    const config = `${fixture}/custom-config`;
    await mkdir(config);
    await writeFile(`${config}/existing`, "existing configuration");
    await writeFile(
        binary,
        '#!/bin/sh\nprintf "%s\\n" "$HOME" "$XDG_CONFIG_HOME" "$@" > "$HOME/result"\ncat "$XDG_CONFIG_HOME/existing" >> "$HOME/result"\nexit 7\n',
        { mode: 0o700 },
    );
    try {
        await withEnvironment(
            {
                HOME: fixture,
                XDG_CONFIG_HOME: config,
                LIVERY_FIXTURE_TOKEN: "secret",
            },
            async () => {
                const session = await createDevEnvironment(binary);
                try {
                    assert.equal(session.env.LIVERY_FIXTURE_TOKEN, "secret");
                    const persisted = JSON.parse(await readFile(session.statePath, "utf8")).env;
                    assert.equal(persisted.LIVERY_FIXTURE_TOKEN, undefined);
                    assert.equal(persisted.HOME, fixture);
                    assert.equal(persisted.XDG_CONFIG_HOME, config);
                    assert.equal(session.env.HOME, fixture);
                    assert.equal(session.env.XDG_CONFIG_HOME, config);
                    for (const key of [
                        "CARGO_HOME",
                        "RUSTUP_HOME",
                        "XDG_DATA_HOME",
                        "XDG_CACHE_HOME",
                    ]) {
                        assert.equal(session.env[key], process.env[key]);
                    }
                    assert.equal(statSync(session.directory).mode! & 0o077, 0);
                    for (const state of [
                        "pending",
                        "generating",
                        "building",
                        "failed: fixture",
                        "stopped",
                    ]) {
                        session.setState(state);
                        assert.equal(statSync(session.statePath).mode! & 0o077, 0);
                        assert.equal(await launchDev(session.statePath, []), 1);
                        assert.throws(() => statSync(`${fixture}/result`));
                    }
                    session.setState("ready");
                    const result = await output(session.launcher, {
                        args: ["space arg", "single'quote", "$(untouched)", ""],
                        env: { HOME: `${fixture}/wrong`, XDG_CONFIG_HOME: `${fixture}/wrong` },
                    });
                    assert.equal(result.code, 7, result.stderr);
                    assert.equal(
                        await readFile(`${fixture}/result`, "utf8"),
                        `${fixture}\n${config}\nspace arg\nsingle'quote\n$(untouched)\n\nexisting configuration`,
                    );
                    session.setState("stopped");
                    assert.equal(await launchDev(session.statePath, []), 1);
                } finally {
                    await rm(session.directory, { recursive: true, force: true });
                }
                assert.equal(
                    await readFile(`${config}/existing`, "utf8"),
                    "existing configuration",
                );
            },
        );
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

test("launcher preserves unset XDG despite conflicting second-terminal variables", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const binary = `${fixture}/cli`;
    await mkdir(`${fixture}/.config`);
    await writeFile(`${fixture}/.config/existing`, "home configuration");
    await writeFile(
        binary,
        '#!/bin/sh\nprintf "%s\\n" "${XDG_CONFIG_HOME-unset}" "${XDG_DATA_HOME-unset}" "${XDG_CACHE_HOME-unset}" "${LIVERY_CALLER_ONLY-unset}" > "$HOME/result"\ncat "${XDG_CONFIG_HOME:-$HOME/.config}/existing" >> "$HOME/result"\n',
        { mode: 0o700 },
    );
    try {
        await withEnvironment(
            {
                HOME: fixture,
                XDG_CONFIG_HOME: undefined,
                XDG_DATA_HOME: undefined,
                XDG_CACHE_HOME: undefined,
                LIVERY_CALLER_ONLY: undefined,
            },
            async () => {
                const session = await createDevEnvironment(binary);
                try {
                    session.setState("ready");
                    const result = await output(session.launcher, {
                        env: {
                            HOME: `${fixture}/wrong`,
                            XDG_CONFIG_HOME: `${fixture}/wrong`,
                            XDG_DATA_HOME: `${fixture}/conflict`,
                            XDG_CACHE_HOME: `${fixture}/conflict`,
                            LIVERY_CALLER_ONLY: "conflict",
                        },
                    });
                    assert.equal(result.code, 0, result.stderr);
                    assert.equal(
                        await readFile(`${fixture}/result`, "utf8"),
                        "unset\nunset\nunset\nunset\nhome configuration",
                    );
                } finally {
                    await rm(session.directory, { recursive: true, force: true });
                }
            },
        );
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

test("process group cleanup terminates grandchildren and retains failure codes", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const child = startDevProcess(["sh", "-c", `sleep 60 & echo $! > '${fixture}/pid'; wait`], {
        cwd: fixture,
    });
    try {
        for (let attempt = 0; attempt < 100; attempt++) {
            try {
                await stat(`${fixture}/pid`);
                break;
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
        }
        const grandchild = Number(await readFile(`${fixture}/pid`, "utf8"));
        await child.stop();
        assert.throws(() => process.kill(grandchild, 0));
        const failed = startDevProcess(["sh", "-c", "exit 17"], { cwd: fixture });
        assert.equal(await failed.status, 17);
        const completed = startDevProcess(["sh", "-c", "exit 0"], { cwd: fixture });
        assert.equal(await completed.status, 0);
    } finally {
        await child.stop();
        await rm(fixture, { recursive: true, force: true });
    }
});

import { createDevProcesses } from "./dev-process.ts";

test("successful one-shot build leaves services running; service exit stops its sibling", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const group = createDevProcesses({ cwd: fixture });
    let finished = false;
    void group.finished.then(() => {
        finished = true;
    });
    try {
        group.startService(["sh", "-c", `echo $$ > '${fixture}/pid'; sleep 60`]);
        await group.run(["sh", "-c", "exit 0"]);
        assert.equal(finished, false);
        const pid = Number(await readFile(`${fixture}/pid`, "utf8"));
        process.kill(pid, 0);
        group.startService(["sh", "-c", "exit 0"]);
        assert.equal(await group.finished, 0);
        assert.throws(() => process.kill(pid, 0));
    } finally {
        await group.stop(0);
        await rm(fixture, { recursive: true, force: true });
    }
});

test("failed service retains its failure code while stopping other services", async () => {
    const group = createDevProcesses({ cwd: process.cwd() });
    group.startService(["sh", "-c", "sleep 60"]);
    group.startService(["sh", "-c", "exit 23"]);
    assert.equal(await group.finished, 23);
});

test("generation in flight keeps readiness closed and later Rust edits rebuild", async () => {
    const gate = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    const states: string[] = [];
    let builds = 0;
    const cycle = createDevCycle({
        generate: async () => {
            started.resolve();
            await gate.promise;
        },
        build: () => {
            builds++;
            return Promise.resolve();
        },
        reapply: () => Promise.resolve(),
        state: (value) => states.push(value),
        isGenerationInput: (path) => path.endsWith("theme.ts"),
        debounceMs: 10_000,
    });
    cycle.schedule("theme.ts");
    const work = cycle.flush();
    await started.promise;
    assert.equal(states.at(-1), "generating");
    cycle.schedule("livery/cli/src/main.rs");
    assert.equal(states.at(-1), "pending");
    cycle.schedule("adapters/ghostty/themes/generated.toml");
    gate.resolve();
    await work;
    assert.equal(builds, 1);
    assert.equal(states.filter((state) => state === "ready").length, 1);
    cycle.stop();
});

import { provisionDevLauncher } from "./dev-environment.ts";

test("launcher symlink uses existing user bin and never takes another session or command", async () => {
    const home = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const bin = `${home}/.local/bin`;
    await mkdir(bin, { recursive: true });
    const first = `${home}/first-launcher`;
    const second = `${home}/second-launcher`;
    await writeFile(first, "first");
    await writeFile(second, "second");
    try {
        const earlier = `${home}/earlier`;
        await mkdir(earlier);
        await writeFile(`${earlier}/livery-dev`, "shadow");
        assert.throws(
            () => provisionDevLauncher(first, { home, path: `${earlier}:${bin}` }),
            /earlier\/livery-dev already exists/,
        );
        await rm(`${earlier}/livery-dev`);
        const link = provisionDevLauncher(first, { home, path: `/usr/bin:${bin}` });
        assert.equal(link.path, `${bin}/livery-dev`);
        assert.equal(readlinkSync(link.path), first);
        assert.throws(() => provisionDevLauncher(second, { home, path: bin }), /already exists/);
        link.remove();
        await writeFile(`${bin}/livery-dev`, "foreign command");
        assert.throws(() => provisionDevLauncher(first, { home, path: bin }), /already exists/);
        assert.equal(await readFile(`${bin}/livery-dev`, "utf8"), "foreign command");
        assert.throws(() => provisionDevLauncher(first, { home, path: "/usr/bin" }), /user bin/);
    } finally {
        await rm(home, { recursive: true, force: true });
    }
});

test("stopping dev cancels a running generation subprocess and its descendants", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const processes = createDevProcesses({ cwd: fixture });
    const cycle = createDevCycle({
        generate: () => processes.run(["sh", "-c", `sleep 60 & echo $! > '${fixture}/pid'; wait`]),
        build: () => {
            throw new Error("Build must not start after cancelled generation");
        },
        reapply: () => {
            throw new Error("Reapply must not start after cancelled generation");
        },
        state: () => {},
        isGenerationInput: () => true,
        debounceMs: 10_000,
    });
    try {
        cycle.schedule("theme.ts");
        const work = cycle.flush();
        for (let attempt = 0; attempt < 100; attempt++) {
            try {
                await stat(`${fixture}/pid`);
                break;
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
        }
        const pid = Number(await readFile(`${fixture}/pid`, "utf8"));
        cycle.stop();
        await processes.stop(143);
        await work;
        assert.throws(() => process.kill(pid, 0));
    } finally {
        cycle.stop();
        await processes.stop(143);
        await rm(fixture, { recursive: true, force: true });
    }
});

test("failed compilation keeps CLI unavailable until a successful rebuild", async () => {
    const states: string[] = [];
    let fail = true;
    let reapplies = 0;
    const cycle = createDevCycle({
        generate: () => Promise.resolve(),
        build: () => (fail ? Promise.reject(new Error("compile failed")) : Promise.resolve()),
        reapply: () => {
            reapplies++;
            return Promise.resolve();
        },
        state: (value) => states.push(value),
        isGenerationInput: () => false,
        debounceMs: 10_000,
    });
    cycle.schedule("livery/cli/src/main.rs");
    await cycle.flush();
    assert.equal(states.at(-1), "failed: compile failed");
    assert.equal(reapplies, 0);
    fail = false;
    cycle.schedule("livery/cli/src/main.rs");
    await cycle.flush();
    assert.equal(states.at(-1), "ready");
    assert.equal(reapplies, 1);
    cycle.stop();
});

test("launcher placement handles unset HOME without changing the captured environment", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    await mkdir(`${fixture}/bin`);
    const binary = `${fixture}/cli`;
    await writeFile(binary, '#!/bin/sh\nprintf "%s" "${HOME-unset}"\n', { mode: 0o700 });
    try {
        await withEnvironment({ HOME: undefined }, async () => {
            const session = await createDevEnvironment(binary);
            try {
                const placement = await output(process.execPath, {
                    args: [
                        "--input-type=module",
                        "-e",
                        `import { provisionDevLauncher } from ${JSON.stringify(
                            new URL("./dev-environment.ts", import.meta.url).href,
                        )}; provisionDevLauncher(process.argv[1], { home: process.env.HOME, path: process.argv[2] });`,
                        session.launcher,
                        `${fixture}/bin`,
                    ],
                });
                assert.equal(placement.code, 1);
                assert.match(placement.stderr, /user bin/);
                const link = provisionDevLauncher(session.launcher, {
                    home: fixture,
                    path: `${fixture}/bin`,
                });
                try {
                    assert.equal(session.env.HOME, undefined);
                    session.setState("ready");
                    const result = await output(link.path, {
                        env: { HOME: `${fixture}/conflict` },
                    });
                    assert.equal(result.code, 0, result.stderr);
                    assert.equal(result.stdout, "unset");
                } finally {
                    link.remove();
                }
            } finally {
                await rm(session.directory, { recursive: true, force: true });
            }
        });
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

test("launcher recovers only dangling Black Atom session links", async () => {
    const home = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const bin = `${home}/bin`;
    await mkdir(bin);
    const session = await createDevEnvironment(`${home}/cli`);
    const stale = await createDevEnvironment(`${home}/old-cli`);
    await rm(stale.directory, { recursive: true, force: true });
    const command = `${bin}/livery-dev`;
    try {
        await symlink(stale.launcher, command);
        const recovered = provisionDevLauncher(session.launcher, { home, path: bin });
        assert.equal(await readlink(command), session.launcher);
        assert.throws(
            () => provisionDevLauncher(stale.launcher, { home, path: bin }),
            /already exists/,
        );
        recovered.remove();
        for (const target of [
            `${home}/foreign-missing`,
            `${home}/black-atom-dev-0123456789abcdef/livery-dev`,
        ]) {
            await symlink(target, command);
            assert.throws(
                () => provisionDevLauncher(session.launcher, { home, path: bin }),
                /already exists/,
            );
            assert.equal(await readlink(command), target);
            await rm(command);
        }
        await writeFile(command, "foreign command");
        assert.throws(
            () => provisionDevLauncher(session.launcher, { home, path: bin }),
            /already exists/,
        );
        assert.equal(await readFile(command, "utf8"), "foreign command");
    } finally {
        await rm(session.directory, { recursive: true, force: true });
        await rm(home, { recursive: true, force: true });
    }
});

import { findAbandonedLaunchers, removeAbandonedLauncher } from "./dev-environment.ts";

test("abandoned launchers are reported only for dead owners and removed on request", async () => {
    const home = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const bin = `${home}/bin`;
    await mkdir(bin);
    const session = await createDevEnvironment(`${home}/cli`);
    const command = `${bin}/livery-dev`;
    try {
        await symlink(session.launcher, command);
        assert.deepEqual(findAbandonedLaunchers(bin), []);
        const dead = spawnSync("true").pid;
        const state = JSON.parse(await readFile(session.statePath, "utf8"));
        await writeFile(session.statePath, JSON.stringify({ ...state, owner: dead }));
        const [abandoned, ...rest] = findAbandonedLaunchers(bin);
        assert.deepEqual(rest, []);
        assert.equal(abandoned.command, command);
        assert.equal(abandoned.directory, session.directory);
        assert.equal(abandoned.owner, dead);
        assert.equal(abandoned.status, "pending");
        assert.throws(
            () => provisionDevLauncher(session.launcher, { home, path: bin }),
            /already exists/,
        );
        removeAbandonedLauncher(abandoned);
        await assert.rejects(readlink(command), { code: "ENOENT" });
        await assert.rejects(stat(session.directory), { code: "ENOENT" });
    } finally {
        await rm(session.directory, { recursive: true, force: true });
        await rm(home, { recursive: true, force: true });
    }
});
