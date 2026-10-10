import { execFile, type ExecFileOptions } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runCommand(
    command: string[],
    options: ExecFileOptions = {},
): Promise<string> {
    try {
        const { stdout } = await execFileAsync(command[0], command.slice(1), {
            ...options,
            encoding: "utf8",
        });
        return stdout;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Explicitly rethrow the error to propagate it
        throw new Error(
            `Failed to run command ${command.join(" ")}: ${errorMessage}`,
        );
    }
}
