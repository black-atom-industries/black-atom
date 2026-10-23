import { defineConfig } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    server: {
        port: 3000,
        strictPort: true,
    },
    plugins: [tanstackStart(), nitro({ preset: "vercel" }), react()],
});
