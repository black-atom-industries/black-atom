/**
 * Black Atom Obsidian Theme — Full Build
 *
 * Runs generate + postGenerate + format.
 * For standalone builds (not driven by adapters:dev).
 */

async function run(cmd: string[]): Promise<void> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await command.output();
  if (code !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}`);
  }
}

async function build(): Promise<void> {
  console.log("Building Black Atom Obsidian theme...");

  console.log("Step 1: Generating theme tokens...");
  await run(["deno", "task", "generate"]);

  console.log("Step 2: Assembling theme.css...");
  await run(["deno", "task", "postGenerate"]);

  console.log("Step 3: Formatting...");
  await run(["deno", "fmt", "."]);

  console.log("Build complete.");
}

build();
