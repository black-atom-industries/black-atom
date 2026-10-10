import { assert, test } from "vitest";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { themeCatalog, themeKeys } from "../themes/catalog.ts";
import { discoverAdapters } from "./discover-adapters.ts";
import { processTemplates } from "./template.ts";
import { createAdapterConfigSchema } from "./validate-adapter.ts";

const adaptersDir = fileURLToPath(new URL("../../../adapters/", import.meta.url));

async function* walkFiles(directory: string) {
    for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
        if (!entry.isDirectory()) {
            yield { name: entry.name, path: join(entry.parentPath, entry.name) };
        }
    }
}
const adapterNames = [
    "delta",
    "ghostty",
    "herdr",
    "kagi",
    "lazygit",
    "niri",
    "nvim",
    "obsidian",
    "tmux",
    "tuicr",
    "waybar",
    "wezterm",
    "zed",
];
const collectionKeys = [
    ...new Set(
        Object.values(themeCatalog).map((theme) => theme.meta.collection.key),
    ),
].sort();

test("all adapters contain exactly the catalog outputs and regenerate identically", async () => {
    assert.deepEqual(await discoverAdapters(adaptersDir), adapterNames);
    assert.deepEqual(collectionKeys.length, 7);
    assert.deepEqual(themeKeys.length, 32);
    const schema = createAdapterConfigSchema(themeKeys);
    for (const adapter of adapterNames) {
        const adapterDir = join(adaptersDir, adapter);
        const raw = JSON.parse(
            await readFile(join(adapterDir, "black-atom-adapter.json"), "utf8"),
        );
        assert.deepEqual(Object.keys(raw.collections).sort(), collectionKeys, adapter);
        const config = schema.parse(raw);
        const expected = [];
        const keys = [];
        const tempDir = await mkdtemp(join(tmpdir(), "black-atom-test-"));
        try {
            const collections = Object.fromEntries(
                Object.entries(config.collections).map(([key, collection]) => {
                    if (!collection) throw new Error(`Missing collection: ${key}`);
                    const template = [collection.template].flat().map((path) =>
                        join(adapterDir, path)
                    );
                    for (const theme of collection.themes) {
                        const definition = Object.values(themeCatalog).find((item) =>
                            item.meta.key === theme
                        );
                        assert.deepEqual(definition?.meta.collection.key, key);
                    }
                    return [key, { ...collection, template, output: join(tempDir, key) }];
                }),
            );
            assert.deepEqual(await processTemplates({ ...config, collections }, themeCatalog), []);
            for (const [key, collection] of Object.entries(config.collections)) {
                if (!collection) throw new Error(`Missing collection: ${key}`);
                for (const theme of collection.themes) {
                    keys.push(theme);
                    for (const template of [collection.template].flat()) {
                        const name = basename(template).replace(".template.", ".")
                            .replace("collection", theme);
                        const output = join(collection.output ?? dirname(template), name);
                        expected.push(output);
                        const generated = await readFile(join(tempDir, key, name), "utf8");
                        assert.deepEqual(
                            await readFile(join(adapterDir, output), "utf8"),
                            generated,
                            `${adapter}/${output}`,
                        );
                    }
                }
            }
            assert.deepEqual(keys.sort(), [...themeKeys].sort(), adapter);
            const actual = [];
            const outputDirs = new Set(
                expected.map((output) => join(adapterDir, dirname(output))),
            );
            for (const dir of outputDirs) {
                for await (const entry of walkFiles(dir)) {
                    if (entry.name.startsWith("black-atom-")) {
                        actual.push(relative(adapterDir, entry.path));
                    }
                }
            }
            assert.deepEqual([...new Set(actual)].sort(), expected.sort(), adapter);
            const first = new Map<string, string>();
            for await (const entry of walkFiles(tempDir)) {
                first.set(entry.path, await readFile(entry.path, "utf8"));
            }
            assert.deepEqual(await processTemplates({ ...config, collections }, themeCatalog), []);
            const second = new Map<string, string>();
            for await (const entry of walkFiles(tempDir)) {
                second.set(entry.path, await readFile(entry.path, "utf8"));
            }
            assert.deepEqual(second, first, adapter);
        } finally {
            await rm(tempDir, { recursive: true, force: true });
        }
    }
});

test("adapter schema and selection lists match the catalog", async () => {
    const schema = JSON.parse(
        await readFile(new URL("../../adapter.schema.json", import.meta.url), "utf8"),
    );
    assert.deepEqual(Object.keys(schema.properties.collections.properties).sort(), collectionKeys);
    const types = await readFile(join(adaptersDir, "nvim/lua/black-atom/types.lua"), "utf8");
    const aliases = types.split("---@alias BlackAtom.Theme.Collection.Key");
    const themeAliases = [...aliases[0].matchAll(/---\| "([^"]+)"/g)].map((match) => match[1]);
    const collectionAliases = [...aliases[1].split("---@class")[0].matchAll(/---\| "([^"]+)"/g)]
        .map((match) => match[1]);
    assert.deepEqual(themeAliases.sort(), [...themeKeys].sort());
    assert.deepEqual(collectionAliases.sort(), collectionKeys);
    const variants = await readFile(
        join(adaptersDir, "obsidian/styles/variants.settings.yaml"),
        "utf8",
    );
    const options = [...variants.matchAll(/value: (black-atom-[\w-]+)/g)].map((match) => match[1]);
    assert.deepEqual(options.sort(), [...themeKeys].sort());
    const css = await readFile(join(adaptersDir, "obsidian/theme.css"), "utf8");
    const selectors = [...css.matchAll(/\.theme-(?:dark|light)\.(black-atom-[\w-]+)\s*\{/g)]
        .map((match) => match[1]);
    assert.deepEqual(selectors.sort(), [...themeKeys].sort());
});
