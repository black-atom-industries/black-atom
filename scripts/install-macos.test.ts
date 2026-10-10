import { test } from "vitest";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { installMacos } from "./install-macos.ts";

test("installation builds before replacing both artifacts and preserves executable mode", async () => {
    const root = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    try {
        const artifactRoot = join(root, "release");
        const appDestination = join(root, "Applications/livery.app");
        const cliDestination = join(root, "bin/livery");
        await mkdir(appDestination, { recursive: true });
        await writeFile(join(appDestination, "old"), "old");
        await installMacos({
            artifactRoot,
            appDestination,
            cliDestination,
            buildArtifacts: async (options) => {
                assert.equal(options?.bundles, "app");
                assert.equal(await readFile(join(appDestination, "old"), "utf8"), "old");
                await mkdir(join(artifactRoot, "bundle/macos/livery.app"), {
                    recursive: true,
                });
                await writeFile(join(artifactRoot, "bundle/macos/livery.app/new"), "new");
                await writeFile(join(artifactRoot, "livery"), "#!/bin/sh\nexit 0\n", {
                    mode: 0o755,
                });
            },
        });
        assert.equal(await readFile(join(appDestination, "new"), "utf8"), "new");
        assert.equal((await stat(cliDestination)).mode! & 0o111, 0o111);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test("build failure leaves installed artifacts untouched", async () => {
    const root = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    try {
        const appDestination = join(root, "livery.app");
        const cliDestination = join(root, "livery");
        await writeFile(appDestination, "old app");
        await writeFile(cliDestination, "old cli");
        await assert.rejects(
            () =>
                installMacos({
                    appDestination,
                    cliDestination,
                    buildArtifacts: () => Promise.reject(new Error("build failed")),
                }),
            /build failed/,
        );
        assert.equal(await readFile(appDestination, "utf8"), "old app");
        assert.equal(await readFile(cliDestination, "utf8"), "old cli");
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test("CLI installation failure reports app partial success", async () => {
    const root = await mkdtemp(join(tmpdir(), "black-atom-test-"));
    try {
        await mkdir(join(root, "bundle/macos/livery.app"), { recursive: true });
        await assert.rejects(
            () =>
                installMacos({
                    artifactRoot: root,
                    appDestination: join(root, "installed.app"),
                    cliDestination: join(root, "bin/livery"),
                    buildArtifacts: () => Promise.resolve(),
                }),
            /App installed.*CLI installation failed/,
        );
        assert.equal((await stat(join(root, "installed.app"))).isDirectory(), true);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
