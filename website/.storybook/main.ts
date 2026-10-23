import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
    framework: {
        name: "@storybook/react-vite",
        options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
    },
    stories: ["../src/**/*.stories.tsx"],
    addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true,
    },
});
