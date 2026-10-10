/**
 * Discovers adapters by looking for black-atom-adapter.json files
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config.ts";
import { themeKeys } from "../themes/catalog.ts";
import { createAdapterConfigSchema } from "./validate-adapter.ts";
import { isNotFound } from "./fs-errors.ts";

/**
 * Discovers all enabled adapters in the adapters directory
 * An adapter is any directory that contains a black-atom-adapter.json file with enabled: true (or enabled not specified)
 */
export async function discoverAdapters(adaptersDir: string): Promise<string[]> {
    const adapters: string[] = [];
    const adapterConfigSchema = createAdapterConfigSchema(themeKeys);

    try {
        // Read all entries in the adapters directory
        for (const entry of await readdir(adaptersDir, { withFileTypes: true })) {
            // Skip if not a directory
            if (!entry.isDirectory()) continue;

            // Skip the core directory
            if (entry.name === "core") continue;

            // Skip hidden directories
            if (entry.name.startsWith(".")) continue;

            // Check if black-atom-adapter.json exists
            const adapterFilePath = join(adaptersDir, entry.name, "black-atom-adapter.json");
            try {
                await stat(adapterFilePath);

                // Read and parse the adapter config with Zod validation
                const configText = await readFile(adapterFilePath, "utf8");
                const config = adapterConfigSchema.parse(JSON.parse(configText));

                // Only include if enabled (defaults to true if not specified)
                if (config.enabled !== false) {
                    adapters.push(entry.name);
                }
            } catch (error) {
                if (isNotFound(error)) continue;
                throw new Error(`Cannot read adapter config ${adapterFilePath}: ${error}`);
            }
        }
    } catch (error) {
        throw new Error(`Failed to discover adapters: ${error}`);
    }

    return adapters.sort(); // Sort alphabetically for consistency
}

/**
 * Discovers adapters in the monorepo.
 */
export async function getAdapters(): Promise<string[]> {
    const adaptersDir = config.dir.adapters;
    return await discoverAdapters(adaptersDir);
}
