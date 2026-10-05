import { defineConfig, devices } from "@playwright/test";
import { bridgePort, bridgeToken, fixtureEnv, vitePort } from "./lib/environment.ts";

const baseURL = `http://127.0.0.1:${vitePort}`;
const bridgeEnv = {
    LIVERY_DEV_BRIDGE_TOKEN: bridgeToken,
    LIVERY_DEV_BRIDGE_PORT: String(bridgePort),
};

export default defineConfig({
    testDir: "./tests",
    // Every test shares one fixture home and one bridge.
    fullyParallel: false,
    workers: 1,
    reporter: [["html", { open: "never" }], ["list"]],
    use: {
        ...devices["Desktop Chrome"],
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    webServer: [
        {
            name: "bridge",
            command: "../../target/debug/livery-bridge",
            port: bridgePort,
            env: { ...fixtureEnv, ...bridgeEnv },
            reuseExistingServer: false,
        },
        {
            name: "vite",
            command:
                `deno run -A npm:vite --config e2e/vite.config.ts --port ${vitePort} --strictPort`,
            cwd: "..",
            url: baseURL,
            env: bridgeEnv,
            reuseExistingServer: false,
        },
    ],
});
