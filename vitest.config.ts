import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: { "@core": fileURLToPath(new URL("core/src", import.meta.url)) },
    },
    test: {
        include: ["**/*{_test,.test}.{ts,tsx}"],
        exclude: ["**/node_modules/**", "**/.claude/**", "livery/e2e/**", "target/**"],
    },
});
