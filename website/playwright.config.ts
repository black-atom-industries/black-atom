import { defineConfig, devices } from "@playwright/test";

const port = 4319;

export default defineConfig({
    testDir: "./e2e",
    outputDir: "./e2e/test-results",
    reporter: [["list"]],
    use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${port}`,
        colorScheme: "dark",
    },
    webServer: {
        command: `vp build && vp preview --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: false,
        timeout: 180_000,
    },
});
