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

let cleaningUp = false;

function cleanup() {
    if (cleaningUp) return;
    cleaningUp = true;
    // Each task nests further `deno task` wrappers; signalling only the direct
    // children would leave the grandchildren (the actual servers) running.
    // pid 0 addresses our whole process group, which includes them.
    Deno.kill(0, "SIGTERM");
    Deno.exit(0);
}

Deno.addSignalListener("SIGINT", cleanup);
Deno.addSignalListener("SIGTERM", cleanup);

await Promise.race(children.map((child) => child.status));
cleanup();
