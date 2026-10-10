import {
    lstatSync,
    readlinkSync,
    renameSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isAlreadyExists, isNotFound } from "../core/src/lib/fs-errors.ts";
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
    "CARGO_TARGET_DIR",
]);

/** `state.json` sits on disk for the whole session, so it carries only what the CLI needs. */
export function launcherEnv(env: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(env).filter(
            ([key]) =>
                LAUNCHER_ENV_KEYS.has(key) || key.startsWith("XDG_") || key.startsWith("LC_"),
        ),
    );
}

export async function createDevEnvironment(binary: string) {
    const directory = await mkdtemp(join(tmpdir(), "black-atom-dev-"));
    const env: Record<string, string> = {
        ...process.env,
        CARGO_TARGET_DIR: dirname(dirname(binary)),
    };
    const statePath = join(directory, "state.json");
    const launcher = join(directory, "livery-dev");
    const state: DevState = {
        owner: process.pid,
        status: "pending",
        binary,
        env: launcherEnv(env),
    };
    function setState(status: string) {
        state.status = status;
        writeFileSync(`${statePath}.tmp`, JSON.stringify(state), { mode: 0o600 });
        renameSync(`${statePath}.tmp`, statePath);
    }
    setState("pending");
    const launchScript = fileURLToPath(new URL("./dev-launcher.ts", import.meta.url));
    await writeFile(
        launcher,
        `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(launchScript)} ${shellQuote(
            statePath,
        )} "$@"\n`,
        { mode: 0o700 },
    );
    return { directory, env, launcher, statePath, setState };
}

export function provisionDevLauncher(
    launcher: string,
    { home = homedir(), path: searchPath }: { home?: string; path: string },
) {
    for (const directory of searchPath.split(":")) {
        const command = join(directory || process.cwd(), "livery-dev");
        try {
            const existing = lstatSync(command);
            if (existing.isSymbolicLink()) {
                const target = readlinkSync(command);
                if (
                    basename(target) === "livery-dev" &&
                    /^black-atom-dev-[0-9A-Za-z]+$/.test(basename(dirname(target))) &&
                    dirname(dirname(target)) === resolve(tmpdir())
                ) {
                    try {
                        lstatSync(target);
                    } catch (error) {
                        if (!isNotFound(error)) throw error;
                        const current = lstatSync(command);
                        if (
                            current.isSymbolicLink() &&
                            current.ino === existing.ino &&
                            current.dev === existing.dev &&
                            readlinkSync(command) === target
                        ) {
                            rmSync(command);
                            console.log(`Removed stale development launcher: ${command}`);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            if (isNotFound(error)) continue;
            throw error;
        }
        throw new Error(
            `${command} already exists. Another dev session or command owns livery-dev; stop that session or remove its stale link explicitly.`,
        );
    }
    const directories = searchPath
        .split(":")
        .filter((path) => path.startsWith(home + "/") && path.endsWith("/bin"));
    const preferred = join(home, ".local/bin");
    directories.sort((a, b) => Number(b === preferred) - Number(a === preferred));
    const directory = directories.find((path) => {
        try {
            return statSync(path).isDirectory();
        } catch (error) {
            if (isNotFound(error)) return false;
            throw error;
        }
    });
    if (!directory) {
        throw new Error("livery-dev needs an existing user bin directory in PATH.");
    }
    const path = join(directory, "livery-dev");
    try {
        symlinkSync(launcher, path);
    } catch (error) {
        if (isAlreadyExists(error)) {
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
                if (lstatSync(path).isSymbolicLink() && readlinkSync(path) === launcher) {
                    rmSync(path);
                }
            } catch (error) {
                if (!isNotFound(error)) throw error;
            }
        },
    };
}
