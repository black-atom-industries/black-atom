import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const devBridgePort = process.env.LIVERY_DEV_BRIDGE_PORT ?? "1422";
const devBridgeToken = process.env.LIVERY_DEV_BRIDGE_TOKEN ?? "";

export default defineConfig({
    define: {
        "import.meta.env.VITE_LIVERY_DEV_BRIDGE_TOKEN": JSON.stringify(
            devBridgeToken,
        ),
    },
    clearScreen: false,
    resolve: {
        alias: { "@": fileURLToPath(new URL("src", import.meta.url)) },
    },
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
            addExtensions: true,
        }),
        react(),
    ],
    optimizeDeps: {
        // Only imported by the lazy settings route — without pre-bundling,
        // Vite discovers it mid-session on first navigation and the Tauri
        // webview trips over the re-optimize reload (504 Outdated Dep).
        include: ["@tauri-apps/plugin-opener"],
    },
    server: {
        port: 1420,
        strictPort: true,
        fs: { allow: [".."] },
        host: host || false,
        hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
        proxy: {
            "/__livery": {
                target: `http://127.0.0.1:${devBridgePort}`,
            },
        },
    },
});
