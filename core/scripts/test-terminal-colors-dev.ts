import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { join } from "node:path";
import process from "node:process";

/**
 * Watches generated Ghostty config files for changes and re-runs the terminal color test.
 *
 * Requires `npm run dev` (or manual generation) to be running separately.
 * When generation writes new .conf files, this watcher picks up the change,
 * reloads Ghostty, and re-displays the color test.
 *
 * Ghostty: Config is auto-reloaded after each change (via SIGUSR2).
 * Other terminals: Manual config reload is required after changes.
 */

const scriptDir = import.meta.dirname!;
const repoRoot = join(scriptDir, "..", "..");
const testScript = join(scriptDir, "test-terminal-colors.sh");

const ghosttyThemesDir = join(repoRoot, "adapters", "ghostty", "themes");

if (!existsSync(ghosttyThemesDir)) {
    console.error(`Ghostty themes directory not found: ${ghosttyThemesDir}`);
    console.error("Run `npm run generate` first.");
    process.exit(1);
}

const args = process.argv.slice(2).filter((a) => a !== "--capture");
const themeName = args[0] || "";
const capture = process.argv.includes("--capture");

const cmd = [
    testScript,
    ...(themeName ? [themeName] : []),
    ...(capture ? ["--capture"] : []),
];

function exec([command, ...args]: string[], stdio: "inherit" | "ignore"): Promise<number> {
    return new Promise((resolve) => {
        const child = spawn(command, args, { stdio });
        child.once("error", () => resolve(1));
        child.once("exit", (code) => resolve(code ?? 1));
    });
}

async function run() {
    await exec(cmd, "inherit");
}

/**
 * Reload Ghostty configuration.
 * Uses SIGUSR2 signal (Ghostty 1.2.0+) with AppleScript menu fallback on macOS.
 */
async function reloadGhostty() {
    // Try SIGUSR2 signal (Ghostty 1.2.0+)
    if (await exec(["pkill", "-SIGUSR2", "ghostty"], "ignore") === 0) return;

    // Fallback: AppleScript on macOS
    if (process.platform === "darwin") {
        await exec([
            "osascript",
            "-e",
            `tell application "System Events"
                tell process "Ghostty"
                    try
                        click menu item "Reload Configuration" of menu "Ghostty" of menu bar 1
                    end try
                end tell
            end tell`,
        ], "ignore");
    }
}

console.log(`Watching ${ghosttyThemesDir} for generated config changes...\n`);
console.log(
    `┌──────────────────────────────────────────────────────────────────┐`,
);
console.log(
    `│                                                                  │`,
);
console.log(
    `│  Watches generated Ghostty .conf files (not theme sources).      │`,
);
console.log(`│  Run dev separately to trigger generation.              │`);
console.log(
    `│                                                                  │`,
);
console.log(
    `└──────────────────────────────────────────────────────────────────┘`,
);
console.log(`\nPress Ctrl+C to stop.\n`);

await run();

let debounce: ReturnType<typeof setTimeout> | undefined;

watch(ghosttyThemesDir, { recursive: true }, (_event, filename) => {
    // Only react to .conf file changes (generated output)
    if (!filename?.endsWith(".conf") || !existsSync(join(ghosttyThemesDir, filename))) return;

    clearTimeout(debounce);
    debounce = setTimeout(async () => {
        await reloadGhostty();
        // Brief pause for Ghostty to apply the new config
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.clear();
        await run();
    }, 300);
});
