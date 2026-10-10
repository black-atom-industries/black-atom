import * as z from "zod";
import { existsSync, watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { styleText } from "node:util";

import { config } from "../config.ts";
import { themeKeys } from "../themes/catalog.ts";

import { type AdapterConfig, createAdapterConfigSchema } from "../lib/validate-adapter.ts";
import { isNotFound } from "../lib/fs-errors.ts";
import log from "../lib/log.ts";
import { processTemplates } from "../lib/template.ts";
import { themeCatalog } from "../themes/catalog.ts";

async function getAdapterConfig(): Promise<AdapterConfig> {
    try {
        const adapterConfigSchema = createAdapterConfigSchema(themeKeys);
        const adapterConfig = await readFile(config.adapterFileName, "utf8");
        return adapterConfigSchema.parse(JSON.parse(adapterConfig));
    } catch (error) {
        if (isNotFound(error)) {
            log.error(
                `No \`${config.adapterFileName}\` found in current directory. Abort.`,
            );
            process.exit(1);
        }

        if (error instanceof z.ZodError) {
            log.error("Invalid adapter configuration!");
            console.dir(error.issues);
            process.exit(1);
        }

        throw error;
    }
}

/**
 * Watch for changes in the adapter's template files and reprocess them
 * when changes are detected.
 */
async function watchAdapter(adapterConfig: AdapterConfig) {
    const cwd = process.cwd();
    const templatePaths = new Set<string>();

    // Collect template paths from the adapter config
    if (adapterConfig.collections) {
        for (const collection of Object.values(adapterConfig.collections)) {
            for (const template of [collection?.template ?? []].flat()) {
                templatePaths.add(template);
            }
        }
    }

    // Watch the current directory for changes to template files
    log.info(`Watching for changes in template files in ${cwd}...`);
    log.info("Press Ctrl+C to stop watching");

    // Debounce mechanism
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isProcessing = false;
    const pendingChanges = new Set<string>();

    // Process changes after debounce period
    const processChanges = async () => {
        if (isProcessing || pendingChanges.size === 0) return;

        isProcessing = true;
        const changes = Array.from(pendingChanges);

        // Filter changes to only include template files or the adapter config
        const relevantChanges = changes.filter((path) =>
            path.includes(".template.") ||
            path.endsWith(config.adapterFileName)
        );

        if (relevantChanges.length > 0) {
            log.hr_thick("👀 Template changes detected");
            log.info(
                `Processing changes:\n${
                    relevantChanges.map((p) => `   - ${styleText("yellow", p)}`)
                        .join("\n")
                }`,
            );

            try {
                // Reload adapter config if it changed
                const updatedAdapterConfig = await getAdapterConfig();
                // Process templates
                await processTemplates(updatedAdapterConfig, themeCatalog);
            } catch (error) {
                log.error(
                    `Error processing changes: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
            }
        }

        pendingChanges.clear();
        isProcessing = false;

        // If more changes accumulated during processing, handle them
        if (pendingChanges.size > 0) {
            debounceTimer = setTimeout(processChanges, 100);
        }
    };

    // Watch the current directory for changes to template files
    watch(cwd, { recursive: true }, (_event, filename) => {
        if (!filename || !existsSync(join(cwd, filename))) return;
        pendingChanges.add(join(cwd, filename));

        // Clear existing timer if there is one
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }

        // Set new timer for debouncing
        debounceTimer = setTimeout(processChanges, 500);
    });
}

export default async function (options: string[] = []) {
    const watchMode = options.includes("--watch") || options.includes("-w");

    const adapterConfig = await getAdapterConfig();

    // Process templates
    const templateErrors = await processTemplates(adapterConfig, themeCatalog);

    // If there are template errors, throw them so they can be caught by the caller
    if (templateErrors.length > 0) {
        throw new Error(templateErrors[0]); // Just throw the first error for simplicity
    }

    // If watch mode is enabled, watch for changes
    if (watchMode) {
        await watchAdapter(adapterConfig);
    }
}
