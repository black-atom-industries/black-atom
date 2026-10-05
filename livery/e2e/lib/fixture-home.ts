import { cpSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "@playwright/test";
import type { Config } from "../../src/bindings.ts";
import { fixture, FIXTURE_HOME_PREFIX } from "./environment.ts";

/** Directory names under `e2e/fixtures/`, each a `$HOME` snapshot. */
export const scenarios = ["existing-installation", "fresh"] as const;
export type Scenario = (typeof scenarios)[number];

/**
 * Replace the fixture home with a scenario's snapshot. Refuses any path that
 * is not a `livery-e2e-*` directory directly under the system temp dir.
 */
export function resetFixtureHome(scenario: Scenario) {
    const home = fixture.home;
    const isDisposable = basename(home).startsWith(FIXTURE_HOME_PREFIX) &&
        realpathSync(dirname(home)) === realpathSync(tmpdir());
    if (!isDisposable) {
        throw new Error(`Refusing to reset ${home}: not a livery-e2e temp directory`);
    }

    const configFile = test.info().config.configFile;
    if (!configFile) throw new Error("The e2e suite runs from playwright.config.ts");

    rmSync(home, { recursive: true, force: true });
    cpSync(join(dirname(configFile), "fixtures", scenario), home, { recursive: true });
    mkdirSync(fixture.tmp, { recursive: true });
}

/** Absolute path of a `~`-relative path inside the fixture home. */
export function homePath(path: string): string {
    return join(fixture.home, path.replace(/^~\//, ""));
}

export function readHomeFile(path: string): string {
    return readFileSync(homePath(path), "utf8");
}

export function readLiveryConfig(): Config {
    return JSON.parse(readHomeFile("~/.config/black-atom/livery/config.json"));
}
