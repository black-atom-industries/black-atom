import { strict as assert } from "node:assert";
import { createDevCycle, isCliInput } from "./dev-cycle.ts";

Deno.test("CLI inputs exclude GUI, docs and temporary files", () => {
    for (
        const path of [
            "livery/cli/src/main.rs",
            "livery/core/Cargo.toml",
            "Cargo.lock",
            "adapters/ghostty/themes/test.toml",
            "adapters/nvim/lua/new.lua",
            "adapters/obsidian/theme.css",
        ]
    ) assert.equal(isCliInput(path), true, path);
    for (
        const path of [
            "livery/src/app.css",
            "livery/src-tauri/src/lib.rs",
            "README.md",
            "target/debug/livery",
            "livery/cli/src/main.rs~",
        ]
    ) assert.equal(isCliInput(path), false, path);
});

Deno.test("readiness closes immediately and failed generation never builds stale CLI", async () => {
    const states: string[] = [];
    let builds = 0;
    let fail = false;
    const cycle = createDevCycle({
        generate: () => fail ? Promise.reject(new Error("invalid theme")) : Promise.resolve(),
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

Deno.test("input during build prevents stale reapply or readiness and builds serially", async () => {
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
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, Deno.env.get(key)]));
    function apply(environment: Record<string, string | undefined>) {
        for (const [key, value] of Object.entries(environment)) {
            if (value === undefined) Deno.env.delete(key);
            else Deno.env.set(key, value);
        }
    }
    apply(values);
    try {
        await run();
    } finally {
        apply(previous);
    }
}

Deno.test("launcher preserves inherited home, existing config, arguments and readiness", async () => {
    const fixture = await Deno.makeTempDir();
    const binary = `${fixture}/cli`;
    const config = `${fixture}/custom-config`;
    await Deno.mkdir(config);
    await Deno.writeTextFile(`${config}/existing`, "existing configuration");
    await Deno.writeTextFile(
        binary,
        '#!/bin/sh\nprintf "%s\\n" "$HOME" "$XDG_CONFIG_HOME" "$@" > "$HOME/result"\ncat "$XDG_CONFIG_HOME/existing" >> "$HOME/result"\nexit 7\n',
        { mode: 0o700 },
    );
    try {
        await withEnvironment({
            HOME: fixture,
            XDG_CONFIG_HOME: config,
            LIVERY_FIXTURE_TOKEN: "secret",
        }, async () => {
            const session = await createDevEnvironment(binary);
            try {
                assert.equal(session.env.LIVERY_FIXTURE_TOKEN, "secret");
                const persisted = JSON.parse(await Deno.readTextFile(session.statePath)).env;
                assert.equal(persisted.LIVERY_FIXTURE_TOKEN, undefined);
                assert.equal(persisted.HOME, fixture);
                assert.equal(persisted.XDG_CONFIG_HOME, config);
                assert.equal(session.env.HOME, fixture);
                assert.equal(session.env.XDG_CONFIG_HOME, config);
                for (
                    const key of [
                        "CARGO_HOME",
                        "RUSTUP_HOME",
                        "DENO_DIR",
                        "XDG_DATA_HOME",
                        "XDG_CACHE_HOME",
                    ]
                ) {
                    assert.equal(session.env[key], Deno.env.get(key));
                }
                assert.equal(Deno.statSync(session.directory).mode! & 0o077, 0);
                for (
                    const state of [
                        "pending",
                        "generating",
                        "building",
                        "failed: fixture",
                        "stopped",
                    ]
                ) {
                    session.setState(state);
                    assert.equal(Deno.statSync(session.statePath).mode! & 0o077, 0);
                    assert.equal(await launchDev(session.statePath, []), 1);
                    assert.throws(() => Deno.statSync(`${fixture}/result`));
                }
                session.setState("ready");
                const result = await new Deno.Command(session.launcher, {
                    args: ["space arg", "single'quote", "$(untouched)", ""],
                    env: { HOME: `${fixture}/wrong`, XDG_CONFIG_HOME: `${fixture}/wrong` },
                    stdout: "piped",
                    stderr: "piped",
                }).output();
                assert.equal(result.code, 7, new TextDecoder().decode(result.stderr));
                assert.equal(
                    await Deno.readTextFile(`${fixture}/result`),
                    `${fixture}\n${config}\nspace arg\nsingle'quote\n$(untouched)\n\nexisting configuration`,
                );
                session.setState("stopped");
                assert.equal(await launchDev(session.statePath, []), 1);
            } finally {
                await Deno.remove(session.directory, { recursive: true });
            }
            assert.equal(await Deno.readTextFile(`${config}/existing`), "existing configuration");
        });
    } finally {
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("launcher preserves unset XDG despite conflicting second-terminal variables", async () => {
    const fixture = await Deno.makeTempDir();
    const binary = `${fixture}/cli`;
    await Deno.mkdir(`${fixture}/.config`);
    await Deno.writeTextFile(`${fixture}/.config/existing`, "home configuration");
    await Deno.writeTextFile(
        binary,
        '#!/bin/sh\nprintf "%s\\n" "${XDG_CONFIG_HOME-unset}" "${XDG_DATA_HOME-unset}" "${XDG_CACHE_HOME-unset}" "${LIVERY_CALLER_ONLY-unset}" > "$HOME/result"\ncat "${XDG_CONFIG_HOME:-$HOME/.config}/existing" >> "$HOME/result"\n',
        { mode: 0o700 },
    );
    try {
        await withEnvironment({
            HOME: fixture,
            XDG_CONFIG_HOME: undefined,
            XDG_DATA_HOME: undefined,
            XDG_CACHE_HOME: undefined,
            LIVERY_CALLER_ONLY: undefined,
        }, async () => {
            const session = await createDevEnvironment(binary);
            try {
                session.setState("ready");
                const result = await new Deno.Command(session.launcher, {
                    env: {
                        HOME: `${fixture}/wrong`,
                        XDG_CONFIG_HOME: `${fixture}/wrong`,
                        XDG_DATA_HOME: `${fixture}/conflict`,
                        XDG_CACHE_HOME: `${fixture}/conflict`,
                        LIVERY_CALLER_ONLY: "conflict",
                    },
                    stdout: "piped",
                    stderr: "piped",
                }).output();
                assert.equal(result.code, 0, new TextDecoder().decode(result.stderr));
                assert.equal(
                    await Deno.readTextFile(`${fixture}/result`),
                    "unset\nunset\nunset\nunset\nhome configuration",
                );
            } finally {
                await Deno.remove(session.directory, { recursive: true });
            }
        });
    } finally {
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("process group cleanup terminates grandchildren and retains failure codes", async () => {
    const fixture = await Deno.makeTempDir();
    const child = startDevProcess(["sh", "-c", `sleep 60 & echo $! > '${fixture}/pid'; wait`], {
        cwd: fixture,
    });
    try {
        for (let attempt = 0; attempt < 100; attempt++) {
            try {
                await Deno.stat(`${fixture}/pid`);
                break;
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
        }
        const grandchild = Number(await Deno.readTextFile(`${fixture}/pid`));
        await child.stop();
        assert.throws(() => Deno.kill(grandchild, 0));
        const failed = startDevProcess(["sh", "-c", "exit 17"], { cwd: fixture });
        assert.equal(await failed.status, 17);
        const completed = startDevProcess(["sh", "-c", "exit 0"], { cwd: fixture });
        assert.equal(await completed.status, 0);
    } finally {
        await child.stop();
        await Deno.remove(fixture, { recursive: true });
    }
});

import { createDevProcesses } from "./dev-process.ts";

Deno.test("successful one-shot build leaves services running; service exit stops its sibling", async () => {
    const fixture = await Deno.makeTempDir();
    const group = createDevProcesses({ cwd: fixture });
    let finished = false;
    void group.finished.then(() => {
        finished = true;
    });
    try {
        group.startService(["sh", "-c", `echo $$ > '${fixture}/pid'; sleep 60`]);
        await group.run(["sh", "-c", "exit 0"]);
        assert.equal(finished, false);
        const pid = Number(await Deno.readTextFile(`${fixture}/pid`));
        Deno.kill(pid, 0);
        group.startService(["sh", "-c", "exit 0"]);
        assert.equal(await group.finished, 0);
        assert.throws(() => Deno.kill(pid, 0));
    } finally {
        await group.stop(0);
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("failed service retains its failure code while stopping other services", async () => {
    const group = createDevProcesses({ cwd: Deno.cwd() });
    group.startService(["sh", "-c", "sleep 60"]);
    group.startService(["sh", "-c", "exit 23"]);
    assert.equal(await group.finished, 23);
});

Deno.test("generation in flight keeps readiness closed and later Rust edits rebuild", async () => {
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

Deno.test("launcher symlink uses existing user bin and never takes another session or command", async () => {
    const home = await Deno.makeTempDir();
    const bin = `${home}/.local/bin`;
    await Deno.mkdir(bin, { recursive: true });
    const first = `${home}/first-launcher`;
    const second = `${home}/second-launcher`;
    await Deno.writeTextFile(first, "first");
    await Deno.writeTextFile(second, "second");
    try {
        const earlier = `${home}/earlier`;
        await Deno.mkdir(earlier);
        await Deno.writeTextFile(`${earlier}/livery-dev`, "shadow");
        assert.throws(
            () => provisionDevLauncher(first, { home, path: `${earlier}:${bin}` }),
            /earlier\/livery-dev already exists/,
        );
        await Deno.remove(`${earlier}/livery-dev`);
        const link = provisionDevLauncher(first, { home, path: `/usr/bin:${bin}` });
        assert.equal(link.path, `${bin}/livery-dev`);
        assert.equal(Deno.readLinkSync(link.path), first);
        assert.throws(() => provisionDevLauncher(second, { home, path: bin }), /already exists/);
        link.remove();
        await Deno.writeTextFile(`${bin}/livery-dev`, "foreign command");
        assert.throws(() => provisionDevLauncher(first, { home, path: bin }), /already exists/);
        assert.equal(await Deno.readTextFile(`${bin}/livery-dev`), "foreign command");
        assert.throws(() => provisionDevLauncher(first, { home, path: "/usr/bin" }), /user bin/);
    } finally {
        await Deno.remove(home, { recursive: true });
    }
});

Deno.test("stopping dev cancels a running generation subprocess and its descendants", async () => {
    const fixture = await Deno.makeTempDir();
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
                await Deno.stat(`${fixture}/pid`);
                break;
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
        }
        const pid = Number(await Deno.readTextFile(`${fixture}/pid`));
        cycle.stop();
        await processes.stop(143);
        await work;
        assert.throws(() => Deno.kill(pid, 0));
    } finally {
        cycle.stop();
        await processes.stop(143);
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("failed compilation keeps CLI unavailable until a successful rebuild", async () => {
    const states: string[] = [];
    let fail = true;
    let reapplies = 0;
    const cycle = createDevCycle({
        generate: () => Promise.resolve(),
        build: () => fail ? Promise.reject(new Error("compile failed")) : Promise.resolve(),
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

import { createGuiRefresh } from "./dev-gui.ts";

Deno.test("GUI refresh observes only successful settled embedded changes", async () => {
    const fixture = await Deno.makeTempDir();
    const refresh = createGuiRefresh(fixture);
    const stamp = `${refresh.directory}/embedded`;
    let embedded = "initial";
    let fail = false;
    const gate = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    let builds = 0;
    const cycle = createDevCycle({
        generate: () => fail ? Promise.reject(new Error("generation failed")) : Promise.resolve(),
        build: async () => {
            if (++builds === 2) {
                started.resolve();
                await gate.promise;
            }
        },
        reapply: () => Promise.resolve(),
        state: (value) => {
            if (value === "ready") refresh.publish(embedded);
        },
        isGenerationInput: (path) => path.endsWith("theme.ts"),
        debounceMs: 10_000,
    });
    try {
        assert.deepEqual(JSON.parse(refresh.config), {
            build: { additionalWatchFolders: [refresh.directory] },
        });
        cycle.schedule("theme.ts");
        await cycle.flush();
        assert.throws(() => Deno.statSync(stamp));
        embedded = "changed";
        cycle.schedule("adapters/ghostty/themes/example.toml");
        const work = cycle.flush();
        await started.promise;
        assert.throws(() => Deno.statSync(stamp));
        fail = true;
        cycle.schedule("theme.ts");
        gate.resolve();
        await work;
        assert.throws(() => Deno.statSync(stamp));
        fail = false;
        embedded = "settled";
        cycle.schedule("theme.ts");
        await cycle.flush();
        assert.equal(await Deno.readTextFile(stamp), "settled");
        Deno.utimeSync(stamp, 1, 1);
        cycle.schedule("livery/cli/src/main.rs");
        await cycle.flush();
        assert.equal(Deno.statSync(stamp).mtime?.getTime(), 1000);
    } finally {
        cycle.stop();
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("launcher placement handles unset HOME without changing the captured environment", async () => {
    const fixture = await Deno.makeTempDir();
    await Deno.mkdir(`${fixture}/bin`);
    const binary = `${fixture}/cli`;
    await Deno.writeTextFile(binary, '#!/bin/sh\nprintf "%s" "${HOME-unset}"\n', { mode: 0o700 });
    try {
        await withEnvironment({ HOME: undefined }, async () => {
            const session = await createDevEnvironment(binary);
            try {
                const placement = await new Deno.Command(Deno.execPath(), {
                    args: [
                        "eval",
                        "--no-config",
                        `import { provisionDevLauncher } from ${
                            JSON.stringify(new URL("./dev-environment.ts", import.meta.url).href)
                        }; provisionDevLauncher(Deno.args[0], { home: Deno.env.get("HOME"), path: Deno.args[1] });`,
                        session.launcher,
                        `${fixture}/bin`,
                    ],
                    stdout: "piped",
                    stderr: "piped",
                }).output();
                assert.equal(placement.code, 1);
                assert.match(new TextDecoder().decode(placement.stderr), /user bin/);
                const link = provisionDevLauncher(session.launcher, {
                    home: fixture,
                    path: `${fixture}/bin`,
                });
                try {
                    assert.equal(session.env.HOME, undefined);
                    session.setState("ready");
                    const result = await new Deno.Command(link.path, {
                        env: { HOME: `${fixture}/conflict` },
                        stdout: "piped",
                        stderr: "piped",
                    }).output();
                    assert.equal(result.code, 0, new TextDecoder().decode(result.stderr));
                    assert.equal(new TextDecoder().decode(result.stdout), "unset");
                } finally {
                    link.remove();
                }
            } finally {
                await Deno.remove(session.directory, { recursive: true });
            }
        });
    } finally {
        await Deno.remove(fixture, { recursive: true });
    }
});

Deno.test("launcher recovers only dangling Black Atom session links", async () => {
    const home = await Deno.makeTempDir();
    const bin = `${home}/bin`;
    await Deno.mkdir(bin);
    const session = await createDevEnvironment(`${home}/cli`);
    const stale = await createDevEnvironment(`${home}/old-cli`);
    await Deno.remove(stale.directory, { recursive: true });
    const command = `${bin}/livery-dev`;
    try {
        await Deno.symlink(stale.launcher, command);
        const recovered = provisionDevLauncher(session.launcher, { home, path: bin });
        assert.equal(await Deno.readLink(command), session.launcher);
        assert.throws(
            () => provisionDevLauncher(stale.launcher, { home, path: bin }),
            /already exists/,
        );
        recovered.remove();
        for (
            const target of [
                `${home}/foreign-missing`,
                `${home}/black-atom-dev-0123456789abcdef/livery-dev`,
            ]
        ) {
            await Deno.symlink(target, command);
            assert.throws(
                () => provisionDevLauncher(session.launcher, { home, path: bin }),
                /already exists/,
            );
            assert.equal(await Deno.readLink(command), target);
            await Deno.remove(command);
        }
        await Deno.writeTextFile(command, "foreign command");
        assert.throws(
            () => provisionDevLauncher(session.launcher, { home, path: bin }),
            /already exists/,
        );
        assert.equal(await Deno.readTextFile(command), "foreign command");
    } finally {
        await Deno.remove(session.directory, { recursive: true });
        await Deno.remove(home, { recursive: true });
    }
});
