import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

export interface DevState {
    owner: number;
    status: string;
    binary: string;
    env: Record<string, string>;
}

export async function launchDev(
    statePath: string,
    args: string[],
): Promise<number> {
    try {
        const state: DevState = JSON.parse(readFileSync(statePath, "utf8"));
        process.kill(state.owner, 0);
        if (state.status !== "ready") {
            console.error(`livery-dev is not ready (${state.status}).`);
            return 1;
        }
        const child = spawn(state.binary, args, {
            env: state.env,
            stdio: "inherit",
        });
        return await new Promise<number>((resolve, reject) => {
            child.once("error", reject);
            child.once("exit", (code) => resolve(code ?? 1));
        });
    } catch (error) {
        console.error(
            `livery-dev is unavailable: ${error instanceof Error ? error.message : error}`,
        );
        return 1;
    }
}

if (import.meta.main) {
    process.exit(await launchDev(process.argv[2], process.argv.slice(3)));
}
