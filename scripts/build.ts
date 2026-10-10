import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repoRoot = new URL("../", import.meta.url);
export const targetDirectory = fileURLToPath(new URL("target/", repoRoot));

export async function run(args: string[], cwd = repoRoot) {
    const [command, ...commandArgs] = args;
    const child = spawn(command, commandArgs, {
        cwd,
        env: { ...process.env, CARGO_TARGET_DIR: targetDirectory },
        stdio: "inherit",
    });
    const code = await new Promise<number>((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code) => resolve(code ?? 1));
    });
    if (code !== 0) throw new Error(`${args.join(" ")} failed (${code})`);
}

export async function build(
    {
        appOnly = false,
        bundles = process.platform === "darwin" ? "app" : undefined,
    }: {
        appOnly?: boolean;
        bundles?: string;
    } = {},
) {
    await run([process.execPath, "core/src/tasks/generate.ts"]);
    await run(
        ["npx", "tauri", "build", ...(bundles ? ["--bundles", bundles] : [])],
        new URL("livery/", repoRoot),
    );
    if (!appOnly) await run(["cargo", "build", "--release", "-p", "livery-cli"]);
}

if (import.meta.main) await build();
