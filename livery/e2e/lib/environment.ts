import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

export const FIXTURE_HOME_PREFIX = "livery-e2e-";

export const vitePort = Number(process.env.LIVERY_E2E_VITE_PORT ?? 1520);
export const bridgePort = Number(process.env.LIVERY_E2E_BRIDGE_PORT ?? 1522);
export const bridgeToken = "livery-e2e";

// The runner creates the fixture home while loading the config; workers
// inherit the variable, so every process agrees on one home per run.
const home = (process.env.LIVERY_E2E_HOME ??= mkdtempSync(join(tmpdir(), FIXTURE_HOME_PREFIX)));

export const fixture = {
    home,
    configHome: join(home, ".config"),
    dataHome: join(home, ".local", "share"),
    cacheHome: join(home, ".cache"),
    tmp: join(home, "tmp"),
};

/** The environment that confines a livery process to the fixture home. */
export const fixtureEnv = {
    HOME: fixture.home,
    XDG_CONFIG_HOME: fixture.configHome,
    XDG_DATA_HOME: fixture.dataHome,
    XDG_CACHE_HOME: fixture.cacheHome,
    TMPDIR: fixture.tmp,
};
