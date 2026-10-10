import { assert, expect, test } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverAdapters } from "./discover-adapters.ts";

test("adapter discovery skips missing configs and disabled adapters", async () => {
    const directory = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    try {
        for (const name of ["missing", "disabled", "enabled"]) {
            await mkdir(join(directory, name));
        }
        for (const enabled of [false, true]) {
            const name = enabled ? "enabled" : "disabled";
            await writeFile(
                join(directory, name, "black-atom-adapter.json"),
                JSON.stringify({ $schema: "schema.json", collections: {}, enabled }),
            );
        }
        assert.deepEqual(await discoverAdapters(directory), ["enabled"]);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

test("adapter discovery rejects malformed JSON and invalid schema with config path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const adapter = join(directory, "broken");
    const configPath = join(adapter, "black-atom-adapter.json");
    try {
        await mkdir(adapter);
        for (const content of ["{", JSON.stringify({ $schema: "schema.json", collections: 42 })]) {
            await writeFile(configPath, content);
            await expect(discoverAdapters(directory)).rejects.toThrow(configPath);
        }
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
