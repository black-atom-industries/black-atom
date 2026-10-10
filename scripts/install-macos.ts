import { build, targetDirectory } from "./build.ts";
import { cp, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import process from "node:process";
import { isNotFound } from "../core/src/lib/fs-errors.ts";
import { dirname, join } from "node:path";

export async function installArtifact(source: string, destination: string) {
    await mkdir(dirname(destination), { recursive: true });
    const staging = await mkdtemp(join(dirname(destination), ".livery-install-"));
    const prepared = join(staging, "prepared");
    const backup = join(staging, "previous");
    try {
        await cp(source, prepared, { recursive: true, preserveTimestamps: true });
        let previous = false;
        try {
            await rename(destination, backup);
            previous = true;
        } catch (error) {
            if (!isNotFound(error)) throw error;
        }
        try {
            await rename(prepared, destination);
        } catch (error) {
            if (previous) await rename(backup, destination);
            throw error;
        }
    } finally {
        await rm(staging, { recursive: true });
    }
}

export async function installMacos({
    appOnly = false,
    appDestination = "/Applications/livery.app",
    cliDestination = join(process.env.CARGO_HOME ?? join(homedir(), ".cargo"), "bin/livery"),
    buildArtifacts = build,
    artifactRoot = join(targetDirectory, "release"),
} = {}) {
    await buildArtifacts({ appOnly, bundles: "app" });
    await installArtifact(join(artifactRoot, "bundle/macos/livery.app"), appDestination);
    console.log(`Installed app: ${appDestination}`);
    if (!appOnly) {
        try {
            await installArtifact(join(artifactRoot, "livery"), cliDestination);
            console.log(`Installed CLI: ${cliDestination}`);
        } catch (error) {
            throw new Error(
                `App installed at ${appDestination}; CLI installation failed: ${error}`,
            );
        }
    }
}

if (import.meta.main) {
    if (process.platform !== "darwin") {
        throw new Error("install:macos requires macOS");
    }
    await installMacos({ appOnly: process.argv.includes("--app-only") });
}
