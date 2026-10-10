import { watch as watchFiles } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import { config } from "../../config.ts";
import { getAdapters } from "../../lib/discover-adapters.ts";
import { generateAllAdapters, generateSingleAdapter } from "./generate.ts";
import { createChangeBatcher } from "./change-batcher.ts";
import { copyToVault } from "./obsidian.ts";

export function isGenerationInput(path: string): boolean {
    if (/(?:^|\/)(?:\.git|node_modules)\/|(?:~|\.sw[op]|\.tmp)$/.test(path)) {
        return false;
    }
    if (path.startsWith(config.dir.themes + "/")) return path.endsWith(".ts");
    const adapterPath = relative(config.dir.adapters, path);
    if (adapterPath.startsWith("../")) return false;
    return (
        adapterPath.includes(".template.") ||
        adapterPath.endsWith("/black-atom-adapter.json") ||
        adapterPath.startsWith("obsidian/styles/")
    );
}

export async function generateDevelopment(paths?: string[]): Promise<void> {
    const all = !paths || paths.some((path) => path.startsWith(config.dir.themes + "/"));
    const enabledAdapters = new Set(await getAdapters());
    const adapters = new Set(
        paths
            ?.filter(isGenerationInput)
            .map((path) => relative(config.dir.adapters, path).split("/")[0])
            .filter((adapter) => enabledAdapters.has(adapter)),
    );
    const results = all
        ? await generateAllAdapters()
        : await Promise.all([...adapters].map(generateSingleAdapter));
    const errors = results.filter((result) => result.error);
    if (errors.length) {
        throw new Error(errors.map((result) => `${result.adapter}: ${result.error}`).join("\n"));
    }
    if ((all && enabledAdapters.has("obsidian")) || adapters.has("obsidian")) {
        await copyToVault();
    }
}

export async function watch(): Promise<void> {
    const generate = async (paths?: string[]) => {
        try {
            await generateDevelopment(paths);
        } catch (error) {
            console.error(error);
        }
    };
    const batcher = createChangeBatcher(generate, 300);
    await generate();
    const watchers = [config.dir.themes, config.dir.adapters].map((dir) =>
        watchFiles(dir, { recursive: true }, (_event, filename) => {
            if (!filename) return;
            const path = join(dir, filename);
            if (isGenerationInput(path)) batcher.schedule(path);
        }),
    );
    console.log("Watching theme sources, adapter templates, and Obsidian styles.");
    const { promise: stopped, resolve: stop } = Promise.withResolvers<void>();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
        await stopped;
    } finally {
        batcher.cancel();
        for (const watcher of watchers) watcher.close();
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
    }
}
