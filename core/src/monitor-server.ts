import { execFile } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { join } from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { config } from "./config.ts";
import type * as Theme from "./types/theme.ts";

const PORT = 4171;

/**
 * Loads the theme map by spawning a fresh Node subprocess.
 * This bypasses the module cache so edited theme files are picked up.
 */
async function loadThemeMap(): Promise<Theme.DefinitionMap> {
    const script = join(config.dir.core, "src", "monitor-dump-themes.ts");
    const { stdout } = await promisify(execFile)(process.execPath, [script], {
        maxBuffer: 64 * 1024 * 1024,
    }).catch((error) => {
        throw new Error(`Failed to load themes: ${error.stderr ?? error}`);
    });

    return JSON.parse(stdout);
}

function json(res: ServerResponse, { data, status = 200 }: { data: unknown; status?: number }): void {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(data));
}

// SSE client management
const sseClients = new Set<ServerResponse>();

/**
 * Starts the preview API server and file watcher.
 * Can be called standalone or imported by dev.ts.
 */
export function startPreviewServer() {
    let themeMap: Theme.DefinitionMap | null = null;
    const ready = loadThemeMap().then((map) => {
        themeMap = map;
    });

    async function watchThemes() {
        await ready;
        let debounce: ReturnType<typeof setTimeout> | undefined;

        watch(config.dir.themes, { recursive: true }, (_event, filename) => {
            if (!filename?.endsWith(".ts") || !existsSync(join(config.dir.themes, filename))) return;

            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                try {
                    themeMap = await loadThemeMap();

                    for (const client of sseClients) client.write("data: reload\n\n");
                    console.log("Themes reloaded, clients notified.");
                } catch (err) {
                    console.error("Failed to reload themes:", err);
                }
            }, 500);
        });
    }

    watchThemes();

    const server = createServer(async (req, res) => {
        const path = new URL(req.url ?? "/", "http://localhost").pathname;

        switch (path) {
            // SSE endpoint — pushes "reload" events when theme files change
            case "/api/events": {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                });
                sseClients.add(res);

                const intervalId = setInterval(
                    () => res.write(": heartbeat\n\n"),
                    15_000,
                );

                req.on("close", () => {
                    clearInterval(intervalId);
                    sseClients.delete(res);
                });
                return;
            }

            // GET /api/themes — all themes as full definitions
            case "/api/themes": {
                await ready;
                return json(res, { data: Object.values(themeMap!) });
            }

            default: {
                await ready;

                // GET /api/themes/:key — single theme definition
                const match = path.match(/^\/api\/themes\/(.+)$/);
                if (match) {
                    const key = match[1] as Theme.Key;
                    const theme = themeMap![key];
                    if (!theme) {
                        return json(res, { data: { error: `Theme not found: ${key}` }, status: 404 });
                    }
                    return json(res, { data: theme });
                }

                return json(res, { data: { error: "Not found" }, status: 404 });
            }
        }
    });

    server.listen(
        PORT,
        () => console.log(`Preview API on http://localhost:${PORT}`),
    );

    return server;
}

if (import.meta.main) {
    startPreviewServer();
}
