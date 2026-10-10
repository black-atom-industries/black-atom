import { watch } from "node:fs";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { isGenerationInput } from "../core/src/tasks/adapters/watch.ts";
import { createDevCycle, isCliInput } from "./dev-cycle.ts";
import { createDevEnvironment, provisionDevLauncher } from "./dev-environment.ts";
import { createDevProcesses } from "./dev-process.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const binary = join(root, "target/debug/livery");
const session = await createDevEnvironment(binary);
const launcherLink = await (async () => {
    try {
        return provisionDevLauncher(session.launcher, {
            home: process.env.HOME,
            path: process.env.PATH ?? "",
        });
    } catch (error) {
        await rm(session.directory, { recursive: true });
        throw error;
    }
})();
const processes = createDevProcesses({
    cwd: root,
    env: session.env,
    stopGraceMs: 1000,
});
const finished = Promise.withResolvers<number>();
let stopping = false;
let initial = true;
let servicesStarted = false;
let fingerprint = "";

async function cliFingerprint(): Promise<string> {
    const hash = createHash("sha256");
    async function visit(path: string) {
        if ((await stat(path)).isDirectory()) {
            const entries = (await readdir(path, { withFileTypes: true })).sort((a, b) =>
                a.name.localeCompare(b.name),
            );
            for (const entry of entries) {
                if (!["target", "node_modules", ".git"].includes(entry.name)) {
                    await visit(join(path, entry.name));
                }
            }
        } else if (isCliInput(relative(root, path))) {
            const name = relative(root, path);
            const content = await readFile(path);
            hash.update(name);
            hash.update(content);
        }
    }
    for (const path of ["Cargo.toml", "Cargo.lock", "livery/cli", "livery/core", "adapters"]) {
        await visit(join(root, path));
    }
    return hash.digest("hex");
}

const cycle = createDevCycle({
    isGenerationInput,
    generate: async (paths) => {
        await processes.run([
            process.execPath,
            join(root, "scripts/dev-generate.ts"),
            ...(initial ? [] : paths),
        ]);
        initial = false;
    },
    build: async () => {
        const next = await cliFingerprint();
        if (next !== fingerprint) {
            await processes.run(["cargo", "build", "-p", "livery-cli"]);
            fingerprint = next;
        }
    },
    reapply: async () => {
        try {
            await processes.run([binary, "reapply"]);
        } catch (error) {
            console.error(
                `Development reapply failed: ${error instanceof Error ? error.message : error}`,
            );
        }
    },
    state: (status) => {
        session.setState(status);
        if (status.startsWith("failed:")) console.error(status);
        if (status === "ready" && !servicesStarted) {
            servicesStarted = true;
            for (const packagePath of ["core/monitor", "livery"]) {
                processes.startService(["npm", "run", "dev"], join(root, packagePath));
            }
        }
    },
});
function onChange(directory: string) {
    return (_event: string, filename: string | null) => {
        if (!filename) return;
        const path = join(directory, filename);
        if (isGenerationInput(path) || isCliInput(relative(root, path))) {
            cycle.schedule(path);
        }
    };
}
const watchers = [
    ...["core/src/themes", "adapters", "livery/cli", "livery/core"].map((path) =>
        watch(join(root, path), { recursive: true }, onChange(join(root, path))),
    ),
    watch(root, onChange(root)),
];
for (const watcher of watchers) {
    watcher.on("error", (error) => {
        if (!stopping) {
            console.error(error);
            void stop(1);
        }
    });
}

async function stop(code: number) {
    if (stopping) return;
    stopping = true;
    cycle.stop();
    for (const watcher of watchers) watcher.close();
    await processes.stop(code);
    finished.resolve(code);
}
const interrupt = () => void stop(130);
const terminate = () => void stop(143);
process.on("SIGINT", interrupt);
process.on("SIGTERM", terminate);

console.log(
    `Development CLI: livery-dev (${launcherLink.path})\nDevelopment home: ${session.env.HOME}`,
);

try {
    cycle.schedule(join(root, "core/src/themes/catalog.ts"));
    await cycle.flush();
    void processes.finished.then(stop);
    process.exitCode = await finished.promise;
} finally {
    await stop(1);
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", terminate);
    session.setState("stopped");
    launcherLink.remove();
    await rm(session.directory, { recursive: true });
}
