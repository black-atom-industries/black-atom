import { assert, expect, test } from "vitest";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { config } from "../../config.ts";
import { isGenerationInput } from "./watch.ts";
import { copyToVault } from "./obsidian.ts";

test("generation inputs include sources and Obsidian styles, excluding generated output", () => {
    for (const path of [
        "obsidian/styles/ui/editor.css",
        "obsidian/styles/ui/a.settings.yaml",
        "ghostty/themes/default/collection.template",
    ]) {
        const actual = path.endsWith(".template") ? path + ".conf" : path;
        assert.deepEqual(isGenerationInput(join(config.dir.adapters, actual)), true);
    }
    assert.deepEqual(isGenerationInput(join(config.dir.themes, "default.ts")), true);
    for (const path of [
        "ghostty/themes/default/generated.conf",
        "obsidian/theme.css",
        "obsidian/styles/editor.css.tmp",
    ]) {
        assert.deepEqual(isGenerationInput(join(config.dir.adapters, path)), false);
    }
});

test("Obsidian dev copy writes CSS and renamed manifest to explicit temporary vault", async () => {
    const vault = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const previous = process.env["OBSIDIAN_DEV_VAULT"];
    process.env["OBSIDIAN_DEV_VAULT"] = vault;
    try {
        await copyToVault();
        const dest = join(vault, ".obsidian/themes/Black Atom Development");
        assert.deepEqual(
            await readFile(join(dest, "theme.css"), "utf8"),
            await readFile(join(config.dir.adapters, "obsidian/theme.css"), "utf8"),
        );
        assert.deepEqual(
            JSON.parse(await readFile(join(dest, "manifest.json"), "utf8")).name,
            "Black Atom Development",
        );
    } finally {
        if (previous === undefined) delete process.env["OBSIDIAN_DEV_VAULT"];
        else process.env["OBSIDIAN_DEV_VAULT"] = previous;
        await rm(vault, { recursive: true, force: true });
    }
});

import { generateDevelopment } from "./watch.ts";

test("development generation skips disabled templates and rejects malformed configs", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const adapter = join(fixture, "disabled");
    await mkdir(adapter);
    const configPath = join(adapter, "black-atom-adapter.json");
    const marker = join(adapter, "postGenerate-ran");
    const script = join(adapter, "postGenerate.ts");
    await writeFile(
        script,
        `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(
            marker,
        )}, "generated");`,
    );
    const adapterConfig = {
        $schema: "schema.json",
        collections: {},
        enabled: false,
        postGenerate: `${process.execPath} ${script}`,
    };
    const original = Object.getOwnPropertyDescriptor(config, "dir")!;
    const directories = config.dir;
    Object.defineProperty(config, "dir", {
        get: () => ({ ...directories, adapters: fixture }),
        configurable: true,
    });
    try {
        await writeFile(configPath, JSON.stringify(adapterConfig));
        await generateDevelopment([join(adapter, "collection.template.conf")]);
        await expect(stat(marker)).rejects.toMatchObject({ code: "ENOENT" });
        await writeFile(configPath, JSON.stringify({ ...adapterConfig, enabled: true }));
        await generateDevelopment([configPath]);
        assert.deepEqual(await readFile(marker, "utf8"), "generated");
        await rm(marker);
        await writeFile(configPath, "{");
        await expect(generateDevelopment([configPath])).rejects.toThrow(
            "Cannot read adapter config",
        );
        await expect(stat(marker)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
        Object.defineProperty(config, "dir", original);
        await rm(fixture, { recursive: true, force: true });
    }
});
