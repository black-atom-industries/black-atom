import { test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { repoRoot, run } from "./build.ts";

test("release commands share the installer target despite inherited CARGO_TARGET_DIR", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    const previous = process.env["CARGO_TARGET_DIR"];
    process.env["CARGO_TARGET_DIR"] = `${fixture}/custom-target`;
    try {
        for (const cwd of [repoRoot, new URL("livery/", repoRoot)]) {
            const output = `${fixture}/target-directory`;
            await run([
                process.execPath,
                "-e",
                'require("node:fs").writeFileSync(process.argv[1], process.env.CARGO_TARGET_DIR);',
                output,
            ], cwd);
            assert.equal(
                await readFile(output, "utf8"),
                fileURLToPath(new URL("target/", repoRoot)),
            );
        }
    } finally {
        if (previous === undefined) delete process.env["CARGO_TARGET_DIR"];
        else process.env["CARGO_TARGET_DIR"] = previous;
        await rm(fixture, { recursive: true, force: true });
    }
});
