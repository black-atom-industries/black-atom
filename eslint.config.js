import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: [
            "**/node_modules/",
            "target/",
            "**/dist/",
            "**/.vite/",
            "core/monitor/src/routeTree.gen.ts",
            "livery/src/routeTree.gen.ts",
            "livery/src/bindings.ts",
            "livery/docs/design-system/reference/",
            "livery/e2e/fixtures/",
            "livery/e2e/playwright-report/",
            "livery/e2e/test-results/",
            "adapters/*/themes/",
            "adapters/nvim/",
            "**/.claude/",
            "**/.agents/",
            "**/.impeccable/",
        ],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                },
            ],
            "no-useless-escape": "off",
            "preserve-caught-error": "off",
        },
    },
);
