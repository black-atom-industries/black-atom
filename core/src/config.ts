import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const config = {
    adapterFileName: "black-atom-adapter.json",
    get dir() {
        return {
            core: fileURLToPath(new URL("../", import.meta.url)),
            themes: join(
                fileURLToPath(new URL("../", import.meta.url)),
                "src",
                "themes",
            ),
            adapters: fileURLToPath(new URL("../../adapters", import.meta.url)),
        };
    },
} as const;
