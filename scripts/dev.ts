/**
 * Runs dev:adapters, dev:monitor, and dev:livery concurrently.
 *
 * Usage:
 *   deno task dev
 */

const taskNames = ["dev:adapters", "dev:monitor", "dev:livery"] as const;

const children = taskNames.map((name) =>
    new Deno.Command("deno", {
        args: ["task", name],
        cwd: Deno.cwd(),
        stdout: "inherit",
        stderr: "inherit",
    }).spawn()
);

function cleanup() {
    for (const child of children) {
        try {
            child.kill("SIGTERM");
        } catch {
            // already exited
        }
    }
    Deno.exit(0);
}

Deno.addSignalListener("SIGINT", cleanup);
Deno.addSignalListener("SIGTERM", cleanup);

await Promise.race(children.map((child) => child.status));
cleanup();
