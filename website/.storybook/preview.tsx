import { definePreview } from "@storybook/react-vite";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import "#/styles/global.css";

export default definePreview({
    addons: [addonDocs(), addonA11y()],
});
