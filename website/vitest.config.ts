import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
    plugins: [react()],
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["src/**/*.test.{ts,tsx}"],
                    exclude: ["src/**/*.browser.test.ts"],
                },
            },
            {
                extends: true,
                optimizeDeps: { include: ["tone", "zod"] },
                test: {
                    name: "audio",
                    include: ["src/**/*.browser.test.ts"],
                    testTimeout: 60_000,
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        headless: true,
                        instances: [{ browser: "chromium" }],
                    },
                },
            },
            {
                extends: true,
                plugins: [storybookTest({ configDir: ".storybook" })],
                // Discovering these mid-run reloads the browser and fails the first cold run.
                optimizeDeps: {
                    include: [
                        "@base-ui/react/dialog",
                        "@base-ui/react/merge-props",
                        "@base-ui/react/slider",
                        "@base-ui/react/tabs",
                        "@base-ui/react/use-render",
                        "cva",
                        "culori",
                        "react",
                        "react-dom",
                        "react-dom/client",
                        "react/jsx-dev-runtime",
                        "react/jsx-runtime",
                        "storybook/test",
                    ],
                },
                test: {
                    name: "storybook",
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        headless: true,
                        instances: [{ browser: "chromium" }],
                    },
                },
            },
        ],
    },
});
