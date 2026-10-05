import { basename, dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import type { DevState } from "./dev-launcher.ts";

export function shellQuote(value: string): string {
    return `'${value.replaceAll("'", "'\\''")}'`;
}

const LAUNCHER_ENV_KEYS = new Set([
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "PATH",
    "TMPDIR",
    "TMUX_TMPDIR",
    "TERM",
    "LANG",
    "CARGO_HOME",
    "RUSTUP_HOME",
    "DENO_DIR",
    "CARGO_TARGET_DIR",
]);

/** `state.json` sits on disk for the whole session, so it carries only what the CLI needs. */
export function launcherEnv(env: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(env).filter(([key]) =>
            LAUNCHER_ENV_KEYS.has(key) || key.startsWith("XDG_") || key.startsWith("LC_")
        ),
    );
}

export async function createDevEnvironment(binary: string) {
    const directory = await Deno.makeTempDir({ prefix: "black-atom-dev-" });
    const env: Record<string, string> = {
        ...Deno.env.toObject(),
        CARGO_TARGET_DIR: dirname(dirname(binary)),
    };
    const statePath = join(directory, "state.json");
    const launcher = join(directory, "livery-dev");
    const state: DevState = { owner: Deno.pid, status: "pending", binary, env: launcherEnv(env) };
    function setState(status: string) {
        state.status = status;
        Deno.writeTextFileSync(`${statePath}.tmp`, JSON.stringify(state), { mode: 0o600 });
        Deno.renameSync(`${statePath}.tmp`, statePath);
    }
    setState("pending");
    const launchScript = fileURLToPath(new URL("./dev-launcher.ts", import.meta.url));
    await Deno.writeTextFile(
        launcher,
        `#!/bin/sh\nexec ${shellQuote(Deno.execPath())} run --no-config -A ${
            shellQuote(launchScript)
        } ${shellQuote(statePath)} "$@"\n`,
        { mode: 0o700 },
    );
    return { directory, env, launcher, statePath, setState };
}

export function provisionDevLauncher(
    launcher: string,
    { home = homedir(), path: searchPath }: { home?: string; path: string },
) {
    for (const directory of searchPath.split(":")) {
        const command = join(directory || Deno.cwd(), "livery-dev");
        try {
            const existing = Deno.lstatSync(command);
            if (existing.isSymlink) {
                const target = Deno.readLinkSync(command);
                if (
                    basename(target) === "livery-dev" &&
                    /^black-atom-dev-[0-9a-f]+$/.test(basename(dirname(target))) &&
                    dirname(dirname(target)) === resolve(tmpdir())
                ) {
                    try {
                        Deno.lstatSync(target);
                    } catch (error) {
                        if (!(error instanceof Deno.errors.NotFound)) throw error;
                        const current = Deno.lstatSync(command);
                        if (
                            current.isSymlink && current.ino === existing.ino &&
                            current.dev === existing.dev && Deno.readLinkSync(command) === target
                        ) {
                            Deno.removeSync(command);
                            console.log(`Removed stale development launcher: ${command}`);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) continue;
            throw error;
        }
        throw new Error(
            `${command} already exists. Another dev session or command owns livery-dev; stop that session or remove its stale link explicitly.`,
        );
    }
    const directories = searchPath.split(":").filter((path) =>
        path.startsWith(home + "/") && path.endsWith("/bin")
    );
    const preferred = join(home, ".local/bin");
    directories.sort((a, b) => Number(b === preferred) - Number(a === preferred));
    const directory = directories.find((path) => {
        try {
            return Deno.statSync(path).isDirectory;
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) return false;
            throw error;
        }
    });
    if (!directory) throw new Error("livery-dev needs an existing user bin directory in PATH.");
    const path = join(directory, "livery-dev");
    try {
        Deno.symlinkSync(launcher, path);
    } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists) {
            throw new Error(
                `${path} already exists. Another dev session or command owns livery-dev; stop that session or remove its stale link explicitly.`,
            );
        }
        throw error;
    }
    return {
        path,
        remove() {
            try {
                if (Deno.lstatSync(path).isSymlink && Deno.readLinkSync(path) === launcher) {
                    Deno.removeSync(path);
                }
            } catch (error) {
                if (!(error instanceof Deno.errors.NotFound)) throw error;
            }
        },
    };
}
