import { defineConfig, devices } from "@playwright/test";

const port = 4319;
const githubStubPort = 4329;

export default defineConfig({
    testDir: "./e2e",
    outputDir: "./e2e/test-results",
    reporter: [["list"]],
    use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${port}`,
        colorScheme: "dark",
        // Without a GPU, headless Chrome logs adapter and driver warnings for the background scene.
        launchOptions: { args: ["--enable-gpu"] },
    },
    webServer: [
        {
            command: `node e2e/github-stub.ts ${githubStubPort}`,
            url: `http://localhost:${githubStubPort}`,
            reuseExistingServer: false,
        },
        {
            command: `vp build && vp preview --port ${port} --strictPort`,
            url: `http://localhost:${port}`,
            reuseExistingServer: false,
            timeout: 180_000,
            env: { GITHUB_API_URL: `http://localhost:${githubStubPort}`, GITHUB_TOKEN: "" },
        },
    ],
});
