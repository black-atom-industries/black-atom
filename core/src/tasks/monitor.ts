import { join } from "node:path";
import process from "node:process";
import { config } from "../config.ts";
import { createDevProcesses } from "../../../scripts/dev-process.ts";

const processes = createDevProcesses({ cwd: join(config.dir.core, "monitor") });
const interrupt = () => void processes.stop(130);
const terminate = () => void processes.stop(143);
process.on("SIGINT", interrupt);
process.on("SIGTERM", terminate);
try {
    processes.startService([
        process.execPath,
        join(config.dir.core, "src/monitor-server.ts"),
    ]);
    processes.startService(["npx", "vite"]);
    process.exitCode = await processes.finished;
} finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", terminate);
}
