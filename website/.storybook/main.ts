import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true,
    },
    features: {
        menuOnboardingChecklist: false,
        sidebarOnboardingChecklist: false,
    },
    framework: {
        name: "@storybook/react-vite",
        options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
    },
    stories: ["../src/components/**/*.stories.tsx", "../src/partials/**/*.stories.tsx"],
    addons: [
        "@storybook/addon-docs",
        "@storybook/addon-a11y",
        ...(process.env.NODE_ENV === "production" ? [] : ["@storybook/addon-vitest"]),
    ],
});
