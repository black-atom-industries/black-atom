/**
 * Discovers adapters by looking for black-atom-adapter.json files
 */

import { dirname, join } from "@std/path";
import { themeKeys } from "../types/theme.ts";
import { createAdapterConfigSchema } from "./validate-adapter.ts";

/**
 * Discovers all enabled adapters in the adapters directory
 * An adapter is any directory that contains a black-atom-adapter.json file with enabled: true (or enabled not specified)
 */
export async function discoverAdapters(adaptersDir: string): Promise<string[]> {
    const adapters: string[] = [];
    const adapterConfigSchema = createAdapterConfigSchema(themeKeys);

    try {
        // Read all entries in the adapters directory
        for await (const entry of Deno.readDir(adaptersDir)) {
            // Skip if not a directory
            if (!entry.isDirectory) continue;

            // Skip the core directory
            if (entry.name === "core") continue;

            // Skip hidden directories
            if (entry.name.startsWith(".")) continue;

            // Check if black-atom-adapter.json exists
            const adapterFilePath = join(adaptersDir, entry.name, "black-atom-adapter.json");
            try {
                await Deno.stat(adapterFilePath);

                // Read and parse the adapter config with Zod validation
                const configText = await Deno.readTextFile(adapterFilePath);
                const config = adapterConfigSchema.parse(JSON.parse(configText));

                // Only include if enabled (defaults to true if not specified)
                if (config.enabled !== false) {
                    adapters.push(entry.name);
                }
            } catch {
                // File doesn't exist or is invalid, skip this adapter
                continue;
            }
        }
    } catch (error) {
        throw new Error(`Failed to discover adapters: ${error}`);
    }

    return adapters.sort(); // Sort alphabetically for consistency
}

/**
 * Convenience function to get adapters using the current working directory
 * Resolves the adapters directory as a sibling of core and discovers adapters
 */
export async function getAdapters(): Promise<string[]> {
    const adaptersDir = join(dirname(Deno.cwd()), "adapters");
    return await discoverAdapters(adaptersDir);
}
