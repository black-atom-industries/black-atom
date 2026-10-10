import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { parseEnv } from "node:util";
import { isNotFound } from "../../lib/fs-errors.ts";
import { config } from "../../config.ts";

const adapterDir = join(config.dir.adapters, "obsidian");

export async function copyToVault(): Promise<void> {
    const env = await readEnvFile(join(adapterDir, ".env"));
    const raw = process.env.OBSIDIAN_DEV_VAULT ?? env.OBSIDIAN_DEV_VAULT;
    if (!raw) return;
    const vault = raw.startsWith("~/") ? join(homedir(), raw.slice(2)) : raw;
    const dest = join(vault, ".obsidian/themes/Black Atom Development");
    await mkdir(dest, { recursive: true });
    await copyFile(join(adapterDir, "theme.css"), join(dest, "theme.css"));
    const manifest = JSON.parse(await readFile(join(adapterDir, "manifest.json"), "utf8"));
    manifest.name = "Black Atom Development";
    await writeFile(join(dest, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Copied Obsidian theme to ${dest}`);
}

async function readEnvFile(path: string): Promise<Record<string, string | undefined>> {
    try {
        return parseEnv(await readFile(path, "utf8"));
    } catch (error) {
        if (isNotFound(error)) return {};
        throw error;
    }
}
