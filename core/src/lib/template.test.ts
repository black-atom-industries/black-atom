/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { join } from "@std/path";
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

async function withTempAdapterDir(
    run: (adapterDir: string) => Promise<void>,
): Promise<void> {
    const adapterDir = await Deno.makeTempDir();
    const originalCwd = Deno.cwd();
    try {
        Deno.chdir(adapterDir);
        await run(adapterDir);
    } finally {
        Deno.chdir(originalCwd);
        await Deno.remove(adapterDir, { recursive: true });
    }
}

Deno.test("processTemplates writes into collection.output when set", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await Deno.mkdir(join(adapterDir, "themes"), { recursive: true });
        await Deno.writeTextFile(
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
        assertEquals(errors, []);

        const written = await Deno.readTextFile(
            join(adapterDir, "themes", "jpn", "black-atom-jpn-koyo-dark.css"),
        );
        assertEquals(written, "bg: #332733;");
    });
});

Deno.test("processTemplates writes next to the template when output is unset", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await Deno.mkdir(join(adapterDir, "themes"), { recursive: true });
        await Deno.writeTextFile(
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
        assertEquals(errors, []);

        const written = await Deno.readTextFile(
            join(adapterDir, "themes", "black-atom-jpn-koyo-dark.css"),
        );
        assertEquals(written, "bg: #332733;");
    });
});

Deno.test("processTemplates renders every template in a template list", async () => {
    await withTempAdapterDir(async (adapterDir) => {
        await Deno.mkdir(join(adapterDir, "themes"), { recursive: true });
        await Deno.writeTextFile(
            join(adapterDir, "themes", "collection.template.css"),
            "bg: <%= theme.ui.bg.default %>;",
        );
        await Deno.writeTextFile(
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
        assertEquals(errors, []);

        const outputDir = join(adapterDir, "themes", "jpn");
        assertEquals(
            await Deno.readTextFile(join(outputDir, "black-atom-jpn-koyo-dark.css")),
            "bg: #332733;",
        );
        assertEquals(
            await Deno.readTextFile(join(outputDir, "black-atom-jpn-koyo-dark.txt")),
            "black-atom-jpn-koyo-dark",
        );
    });
});
