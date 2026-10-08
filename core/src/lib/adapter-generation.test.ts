import { assertEquals } from "@std/assert";
import { walk } from "@std/fs";
import { basename, dirname, fromFileUrl, join, relative } from "@std/path";
import { themeCatalog, themeKeys } from "../themes/catalog.ts";
import { discoverAdapters } from "./discover-adapters.ts";
import { processTemplates } from "./template.ts";
import { createAdapterConfigSchema } from "./validate-adapter.ts";

const adaptersDir = fromFileUrl(new URL("../../../adapters/", import.meta.url));
const adapterNames = [
    "delta",
    "ghostty",
    "herdr",
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

Deno.test("all adapters contain exactly the catalog outputs and regenerate identically", async () => {
    assertEquals(await discoverAdapters(adaptersDir), adapterNames);
    assertEquals(collectionKeys.length, 7);
    assertEquals(themeKeys.length, 32);
    const schema = createAdapterConfigSchema(themeKeys);
    for (const adapter of adapterNames) {
        const adapterDir = join(adaptersDir, adapter);
        const raw = JSON.parse(
            await Deno.readTextFile(join(adapterDir, "black-atom-adapter.json")),
        );
        assertEquals(Object.keys(raw.collections).sort(), collectionKeys, adapter);
        const config = schema.parse(raw);
        const expected = [];
        const keys = [];
        const tempDir = await Deno.makeTempDir();
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
                        assertEquals(definition?.meta.collection.key, key);
                    }
                    return [key, { ...collection, template, output: join(tempDir, key) }];
                }),
            );
            assertEquals(await processTemplates({ ...config, collections }, themeCatalog), []);
            for (const [key, collection] of Object.entries(config.collections)) {
                if (!collection) throw new Error(`Missing collection: ${key}`);
                for (const theme of collection.themes) {
                    keys.push(theme);
                    for (const template of [collection.template].flat()) {
                        const name = basename(template).replace(".template.", ".")
                            .replace("collection", theme);
                        const output = join(collection.output ?? dirname(template), name);
                        expected.push(output);
                        const generated = await Deno.readTextFile(join(tempDir, key, name));
                        assertEquals(
                            await Deno.readTextFile(join(adapterDir, output)),
                            generated,
                            `${adapter}/${output}`,
                        );
                    }
                }
            }
            assertEquals(keys.sort(), [...themeKeys].sort(), adapter);
            const actual = [];
            for await (const entry of walk(adapterDir, { includeDirs: false })) {
                if (
                    entry.name.startsWith("black-atom-") &&
                    entry.name !== "black-atom-adapter.json"
                ) actual.push(relative(adapterDir, entry.path));
            }
            assertEquals(actual.sort(), expected.sort(), adapter);
            const first = new Map<string, string>();
            for await (const entry of walk(tempDir, { includeDirs: false })) {
                first.set(entry.path, await Deno.readTextFile(entry.path));
            }
            assertEquals(await processTemplates({ ...config, collections }, themeCatalog), []);
            const second = new Map<string, string>();
            for await (const entry of walk(tempDir, { includeDirs: false })) {
                second.set(entry.path, await Deno.readTextFile(entry.path));
            }
            assertEquals(second, first, adapter);
        } finally {
            await Deno.remove(tempDir, { recursive: true });
        }
    }
});

Deno.test("adapter schema and selection lists match the catalog", async () => {
    const schema = JSON.parse(
        await Deno.readTextFile(new URL("../../adapter.schema.json", import.meta.url)),
    );
    assertEquals(Object.keys(schema.properties.collections.properties).sort(), collectionKeys);
    const types = await Deno.readTextFile(join(adaptersDir, "nvim/lua/black-atom/types.lua"));
    const aliases = types.split("---@alias BlackAtom.Theme.Collection.Key");
    const themeAliases = [...aliases[0].matchAll(/---\| "([^"]+)"/g)].map((match) => match[1]);
    const collectionAliases = [...aliases[1].split("---@class")[0].matchAll(/---\| "([^"]+)"/g)]
        .map((match) => match[1]);
    assertEquals(themeAliases.sort(), [...themeKeys].sort());
    assertEquals(collectionAliases.sort(), collectionKeys);
    const variants = await Deno.readTextFile(
        join(adaptersDir, "obsidian/styles/variants.settings.yaml"),
    );
    const options = [...variants.matchAll(/value: (black-atom-[\w-]+)/g)].map((match) => match[1]);
    assertEquals(options.sort(), [...themeKeys].sort());
    const css = await Deno.readTextFile(join(adaptersDir, "obsidian/theme.css"));
    const selectors = [...css.matchAll(/\.theme-(?:dark|light)\.(black-atom-[\w-]+)\s*\{/g)]
        .map((match) => match[1]);
    assertEquals(selectors.sort(), [...themeKeys].sort());
});
