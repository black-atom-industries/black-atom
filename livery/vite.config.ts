import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

const host = Deno.env.get("TAURI_DEV_HOST");
const devBridgePort = Deno.env.get("LIVERY_DEV_BRIDGE_PORT") ?? "1422";
const devBridgeToken = Deno.env.get("LIVERY_DEV_BRIDGE_TOKEN") ?? "";

export default defineConfig({
    define: {
        "import.meta.env.VITE_LIVERY_DEV_BRIDGE_TOKEN": JSON.stringify(devBridgeToken),
    },
    clearScreen: false,
    plugins: [
        deno(),
        tanstackRouter({ target: "react", autoCodeSplitting: true, addExtensions: true }),
        react(),
    ],
    resolve: {
        // core is pulled in via deno `links` from ../core, which lives outside
        // livery's project root. The deno vite-plugin only applies livery's
        // import map to in-tree files, so core's bare `culori` import reaches
        // Rollup unresolved. Alias it to the installed package explicitly.
        alias: {
            culori: fileURLToPath(
                new URL("./node_modules/culori/src/index.js", import.meta.url),
            ),
        },
    },
    optimizeDeps: {
        // Only imported by the lazy settings route — without pre-bundling,
        // Vite discovers it mid-session on first navigation and the Tauri
        // webview trips over the re-optimize reload (504 Outdated Dep).
        include: ["@tauri-apps/plugin-opener"],
    },
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
        proxy: {
            "/__livery": {
                target: `http://127.0.0.1:${devBridgePort}`,
            },
        },
    },
});
