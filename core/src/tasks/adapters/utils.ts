export async function runCommand(
    command: string[],
    options: Deno.CommandOptions = {},
): Promise<string> {
    try {
        const process = new Deno.Command(command[0], {
            args: command.slice(1),
            stdout: "piped",
            stderr: "piped",
            ...options,
        });

        const output = await process.output();
        const stdout = new TextDecoder().decode(output.stdout);
        const stderr = new TextDecoder().decode(output.stderr);

        if (!output.success) {
            throw new Error(`Command failed with exit code ${output.code}: ${stderr}`);
        }

        return stdout;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Explicitly rethrow the error to propagate it
        throw new Error(`Failed to run command ${command.join(" ")}: ${errorMessage}`);
    }
}
