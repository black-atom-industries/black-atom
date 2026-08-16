import { existsSync } from "@std/fs";
import { join } from "@std/path";
import { config } from "../../config.ts";
import { getAdapters } from "../../lib/discover-adapters.ts";
import log from "../../lib/log.ts";
import { createAdapterConfigSchema } from "../../lib/validate-adapter.ts";
import { themeKeys } from "../../types/theme.ts";
import { runCommand } from "./utils.ts";

async function runPostGenerate(adapterDir: string, adapter: string): Promise<void> {
    const configPath = join(adapterDir, config.adapterFileName);
    if (!existsSync(configPath)) return;

    const adapterConfigSchema = createAdapterConfigSchema(themeKeys);
    const adapterConfig = adapterConfigSchema.parse(
        JSON.parse(await Deno.readTextFile(configPath)),
    );

    if (adapterConfig.postGenerate) {
        log.info(`Running postGenerate for ${adapter}...`);
        const parts = adapterConfig.postGenerate.split(" ");
        await runCommand(parts, { cwd: adapterDir });
    }
}

async function runGenerate(adapterDir: string): Promise<void> {
    const coreDir = config.dir.core;
    await runCommand([
        "deno",
        "run",
        "-A",
        `${coreDir}/src/cli/index.ts`,
        "generate",
    ], { cwd: adapterDir });
}

/**
 * Generate themes for all adapters
 */
export async function generateAllAdapters({
    logErrors = false,
}: { logErrors?: boolean } = {}) {
    const results: { adapter: string; error?: string }[] = [];
    const adapters = await getAdapters();
    const orgDir = config.dir.org;

    for (const adapter of adapters) {
        const adapterDir = join(orgDir, adapter);

        try {
            await runGenerate(adapterDir);
            await runPostGenerate(adapterDir, adapter);

            results.push({ adapter });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            results.push({ adapter, error: errorMsg });

            // Log error immediately if requested (useful for initial generation)
            if (logErrors) {
                log.error(`Error in ${adapter}: ${errorMsg}`);
            }
        }
    }

    return results;
}

/**
 * Generate themes for a specific adapter using the existing generate command
 */
export async function generateSingleAdapter(
    adapterName: string,
): Promise<{ adapter: string; error?: string }> {
    const adapterDir = join(config.dir.org, adapterName);

    try {
        await runGenerate(adapterDir);
        await runPostGenerate(adapterDir, adapterName);

        return { adapter: adapterName };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return { adapter: adapterName, error: errorMsg };
    }
}
