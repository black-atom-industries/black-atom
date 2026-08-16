/**
 * Black Atom Obsidian Theme — Dev Watch
 *
 * Watches source files and rebuilds on changes:
 * 1. Runs generate (core CLI)
 * 2. Runs postGenerate (assemble theme.css)
 * 3. Copies theme.css + manifest.json to vault (if OBSIDIAN_DEV_VAULT is set)
 *
 * Configure vault path in .env (see .env.example).
 */

import { load } from "@std/dotenv";

await load({ export: true });

const DEBOUNCE_MS = 300;
const WATCH_DIRS = ["themes", "styles"];
const DEV_THEME_NAME = "Black Atom Development";
const DEV_THEME_DIR = "Black Atom Development";

async function run(cmd: string[]): Promise<boolean> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await command.output();
  return code === 0;
}

async function rebuild(): Promise<void> {
  console.log("\n--- Rebuilding ---");

  console.log("Generating theme tokens...");
  if (!await run(["deno", "task", "generate"])) {
    console.error("Generate failed, skipping remaining steps.");
    return;
  }

  console.log("Assembling theme.css...");
  if (!await run(["deno", "task", "postGenerate"])) {
    console.error("Post-generate failed, skipping copy.");
    return;
  }

  await copyToVault();
  console.log("--- Done ---\n");
}

function resolveHome(path: string): string {
  if (path.startsWith("~/")) {
    const home = Deno.env.get("HOME");
    if (home) return home + path.slice(1);
  }
  return path;
}

async function copyToVault(): Promise<void> {
  const raw = Deno.env.get("OBSIDIAN_DEV_VAULT");
  if (!raw) return;
  const vaultPath = resolveHome(raw);

  const dest = `${vaultPath}/.obsidian/themes/${DEV_THEME_DIR}`;

  try {
    await Deno.mkdir(dest, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      console.error(`Failed to create ${dest}:`, err);
      return;
    }
  }

  try {
    await Deno.copyFile("theme.css", `${dest}/theme.css`);
  } catch (err) {
    console.error("Failed to copy theme.css:", err);
    return;
  }

  try {
    const manifest = JSON.parse(await Deno.readTextFile("manifest.json"));
    manifest.name = DEV_THEME_NAME;
    await Deno.writeTextFile(
      `${dest}/manifest.json`,
      JSON.stringify(manifest, null, 2) + "\n",
    );
  } catch (err) {
    console.error("Failed to write dev manifest:", err);
    return;
  }

  console.log(`Copied to ${dest}`);
}

async function dev(): Promise<void> {
  const raw = Deno.env.get("OBSIDIAN_DEV_VAULT");
  const vaultPath = raw ? resolveHome(raw) : undefined;
  console.log("Black Atom Obsidian — Dev Watch");
  console.log(`Watching: ${WATCH_DIRS.join(", ")}`);
  if (vaultPath) {
    console.log(
      `Vault copy: ${vaultPath}/.obsidian/themes/${DEV_THEME_DIR}`,
    );
  } else {
    console.log(
      "Vault copy: disabled (set OBSIDIAN_DEV_VAULT to enable)",
    );
  }

  // Initial build
  await rebuild();

  // Watch for changes
  const watcher = Deno.watchFs(WATCH_DIRS);
  let timeout: ReturnType<typeof setTimeout> | null = null;

  for await (const event of watcher) {
    // Skip generated files to avoid loops
    const isGenerated = event.paths.some((p) =>
      p.includes("/themes/") && !p.includes(".template.") &&
      p.endsWith(".css")
    );
    if (isGenerated) continue;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => rebuild(), DEBOUNCE_MS);
  }
}

dev();
