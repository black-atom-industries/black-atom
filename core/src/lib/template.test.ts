import { assert, test } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { processTemplates } from "./template.ts";
import type { AdapterConfig } from "./validate-adapter.ts";
import type * as Theme from "../types/theme.ts";

const testTheme = {
    meta: { key: "black-atom-jpn-koyo-dark" },
    ui: { bg: { default: "#332733" } },
} as unknown as Theme.Definition;

const themeMap = {
    "black-atom-jpn-koyo-dark": testTheme,
} satisfies Theme.DefinitionMap;

async function withTempAdapterDir(run: (adapterDir: string) => Promise<void>): Promise<void> {
    const adapterDir = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const originalCwd = process.cwd();
    try {
        process.chdir(adapterDir);
        await run(adapterDir);
    } finally {
        process.chdir(originalCwd);
        await rm(adapterDir, { recursive: true, force: true });
    }
}

test("processTemplates writes into collection.output when set", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await mkdir(join(adapterDir, "themes"), { recursive: true });
        await writeFile(
            join(adapterDir, "themes", "collection.template.css"),
            "bg: <%= theme.ui.bg.default %>;",
        );

        const adapterConfig = {
            $schema: "irrelevant",
            enabled: true,
            collections: {
                jpn: {
                    template: "themes/collection.template.css",
                    output: "themes/jpn",
                    themes: ["black-atom-jpn-koyo-dark"],
                },
            },
        } as unknown as AdapterConfig;

        const errors = await processTemplates(adapterConfig, themeMap);
        assert.deepEqual(errors, []);

        const written = await readFile(
            join(adapterDir, "themes", "jpn", "black-atom-jpn-koyo-dark.css"),
            "utf8",
        );
        assert.deepEqual(written, "bg: #332733;");
    });
});

test("processTemplates writes next to the template when output is unset", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await mkdir(join(adapterDir, "themes"), { recursive: true });
        await writeFile(
            join(adapterDir, "themes", "collection.template.css"),
            "bg: <%= theme.ui.bg.default %>;",
        );

        const adapterConfig = {
            $schema: "irrelevant",
            enabled: true,
            collections: {
                jpn: {
                    template: "themes/collection.template.css",
                    themes: ["black-atom-jpn-koyo-dark"],
                },
            },
        } as unknown as AdapterConfig;

        const errors = await processTemplates(adapterConfig, themeMap);
        assert.deepEqual(errors, []);

        const written = await readFile(
            join(adapterDir, "themes", "black-atom-jpn-koyo-dark.css"),
            "utf8",
        );
        assert.deepEqual(written, "bg: #332733;");
    });
});

test("processTemplates renders every template in a template list", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await mkdir(join(adapterDir, "themes"), { recursive: true });
        await writeFile(
            join(adapterDir, "themes", "collection.template.css"),
            "bg: <%= theme.ui.bg.default %>;",
        );
        await writeFile(
            join(adapterDir, "themes", "collection.template.txt"),
            "<%= theme.meta.key %>",
        );

        const adapterConfig = {
            $schema: "irrelevant",
            enabled: true,
            collections: {
                jpn: {
                    template: ["themes/collection.template.css", "themes/collection.template.txt"],
                    output: "themes/jpn",
                    themes: ["black-atom-jpn-koyo-dark"],
                },
            },
        } as unknown as AdapterConfig;

        const errors = await processTemplates(adapterConfig, themeMap);
        assert.deepEqual(errors, []);

        const outputDir = join(adapterDir, "themes", "jpn");
        assert.deepEqual(
            await readFile(join(outputDir, "black-atom-jpn-koyo-dark.css"), "utf8"),
            "bg: #332733;",
        );
        assert.deepEqual(
            await readFile(join(outputDir, "black-atom-jpn-koyo-dark.txt"), "utf8"),
            "black-atom-jpn-koyo-dark",
        );
    });
});
