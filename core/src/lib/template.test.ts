/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { processTemplates } from "./template.ts";
import type { AdapterConfig } from "./validate-adapter.ts";
import type { ThemeDefinition, ThemeMeta } from "../types/theme.ts";

const testTheme = {
    meta: { key: "black-atom-jpn-koyo-yoru" },
    ui: { bg: { default: "#332733" } },
} as unknown as ThemeDefinition;

const themeMap = {
    "black-atom-jpn-koyo-yoru": testTheme,
} as unknown as Record<ThemeMeta["key"], ThemeDefinition | null>;

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
                    themes: ["black-atom-jpn-koyo-yoru"],
                },
            },
        } as unknown as AdapterConfig;

        const errors = await processTemplates(adapterConfig, themeMap);
        assertEquals(errors, []);

        const written = await Deno.readTextFile(
            join(adapterDir, "themes", "jpn", "black-atom-jpn-koyo-yoru.css"),
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
                    themes: ["black-atom-jpn-koyo-yoru"],
                },
            },
        } as unknown as AdapterConfig;

        const errors = await processTemplates(adapterConfig, themeMap);
        assertEquals(errors, []);

        const written = await Deno.readTextFile(
            join(adapterDir, "themes", "black-atom-jpn-koyo-yoru.css"),
        );
        assertEquals(written, "bg: #332733;");
    });
});
