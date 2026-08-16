#!/usr/bin/env -S deno run -A

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

async function run(label: string, cmd: string[]) {
    console.log(cyan(`→ ${label}`));
    const proc = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        cwd: "src-tauri",
        stdout: "inherit",
        stderr: "inherit",
    });

    const { code } = await proc.output();

    if (code !== 0) {
        console.error(red(`✗ ${label} failed`));
        Deno.exit(1);
    }

    console.log(green(`✓ ${label}`));
    console.log();
}

console.log();
console.log(cyan("── Backend Checks ──"));
console.log();

await run("Format check", ["cargo", "fmt", "--", "--check"]);
await run("Clippy", ["cargo", "clippy", "--", "-D", "warnings"]);
await run("Tests", ["cargo", "test"]);

console.log(green("✓ All backend checks passed"));
