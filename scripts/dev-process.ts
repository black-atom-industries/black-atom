import { spawn } from "node:child_process";
import process from "node:process";

export function startDevProcess(
    command: string[],
    options: { cwd: string; env?: Record<string, string>; stopGraceMs?: number },
) {
    const child = spawn(command[0], command.slice(1), {
        ...options,
        env: { ...process.env, ...options.env },
        detached: true,
        stdio: "inherit",
    });
    const status = new Promise<number>((resolve) => {
        child.once("error", (error) => {
            console.error(`${command[0]}: ${error.message}`);
            resolve(1);
        });
        child.once(
            "exit",
            (code, signal) => resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
        );
    });
    function signalGroup(signal: NodeJS.Signals) {
        if (child.pid === undefined) return;
        try {
            process.kill(-child.pid, signal);
        } catch (error) {
            if (
                !(error instanceof Error && "code" in error && error.code === "ESRCH")
            ) throw error;
        }
    }
    return {
        status,
        async stop() {
            signalGroup("SIGTERM");
            await new Promise((resolve) => setTimeout(resolve, options.stopGraceMs ?? 300));
            signalGroup("SIGKILL");
            await status;
        },
    };
}

export function createDevProcesses(
    options: { cwd: string; env?: Record<string, string>; stopGraceMs?: number },
) {
    const children = new Set<ReturnType<typeof startDevProcess>>();
    const finished = Promise.withResolvers<number>();
    let stopping = false;
    async function stop(code: number) {
        if (stopping) return finished.promise;
        stopping = true;
        await Promise.all([...children].map((child) => child.stop()));
        finished.resolve(code);
        return code;
    }
    function start(command: string[], cwd = options.cwd) {
        if (stopping) throw new Error("Development processes are stopping");
        const child = startDevProcess(command, { ...options, cwd });
        children.add(child);
        return child;
    }
    return {
        finished: finished.promise,
        stop,
        startService(command: string[], cwd?: string) {
            const child = start(command, cwd);
            void child.status.then(stop);
        },
        async run(command: string[]) {
            const child = start(command);
            const code = await child.status;
            children.delete(child);
            if (code !== 0) {
                throw new Error(`${command.join(" ")} exited with ${code}`);
            }
        },
    };
}
