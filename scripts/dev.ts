import { join, relative } from "node:path";
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
            home: Deno.env.get("HOME"),
            path: Deno.env.get("PATH") ?? "",
        });
    } catch (error) {
        await Deno.remove(session.directory, { recursive: true });
        throw error;
    }
})();
const processes = createDevProcesses({ cwd: root, env: session.env, stopGraceMs: 1000 });
const finished = Promise.withResolvers<number>();
let stopping = false;
let initial = true;
let servicesStarted = false;
let fingerprint = "";

async function cliFingerprint(): Promise<string> {
    const hash = createHash("sha256");
    async function visit(path: string) {
        const stat = await Deno.stat(path);
        if (stat.isDirectory) {
            const entries = Array.from(Deno.readDirSync(path)).sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            for (const entry of entries) {
                if (!["target", "node_modules", ".git"].includes(entry.name)) {
                    await visit(join(path, entry.name));
                }
            }
        } else if (isCliInput(relative(root, path))) {
            const name = relative(root, path);
            const content = await Deno.readFile(path);
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
            Deno.execPath(),
            "run",
            "-A",
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
                processes.startService(
                    [Deno.execPath(), "task", "dev"],
                    join(root, packagePath),
                );
            }
        }
    },
});
const watchers = [
    Deno.watchFs([
        join(root, "core/src/themes"),
        join(root, "adapters"),
        join(root, "livery/cli"),
        join(root, "livery/core"),
    ], { recursive: true }),
    Deno.watchFs(root, { recursive: false }),
];

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
Deno.addSignalListener("SIGINT", interrupt);
Deno.addSignalListener("SIGTERM", terminate);

console.log(
    `Development CLI: livery-dev (${launcherLink.path})\nDevelopment home: ${session.env.HOME}`,
);
const watching = Promise.all(watchers.map(async (watcher) => {
    for await (const event of watcher) {
        if (event.kind === "access") continue;
        for (const path of event.paths) {
            if (isGenerationInput(path) || isCliInput(relative(root, path))) cycle.schedule(path);
        }
    }
})).catch((error) => {
    if (!stopping) {
        console.error(error);
        void stop(1);
    }
});

try {
    cycle.schedule(join(root, "core/src/themes/catalog.ts"));
    await cycle.flush();
    void processes.finished.then(stop);
    Deno.exitCode = await finished.promise;
} finally {
    await stop(1);
    await watching;
    Deno.removeSignalListener("SIGINT", interrupt);
    Deno.removeSignalListener("SIGTERM", terminate);
    session.setState("stopped");
    launcherLink.remove();
    await Deno.remove(session.directory, { recursive: true });
}
