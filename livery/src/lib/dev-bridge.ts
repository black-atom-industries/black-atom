type DevBridgeInternals = {
    invoke: (command: string, args?: unknown) => Promise<unknown>;
    plugins: {
        path: {
            delimiter: string;
            sep: string;
        };
    };
};

type BrowserRuntime = typeof globalThis & {
    __TAURI_INTERNALS__?: DevBridgeInternals;
};

function argument(value: unknown, name: string): unknown {
    if (typeof value !== "object" || value === null) return undefined;
    return Reflect.get(value, name);
}

function installDevBridge() {
    const runtime = globalThis as BrowserRuntime;
    const token = import.meta.env.VITE_LIVERY_DEV_BRIDGE_TOKEN;

    if (runtime.__TAURI_INTERNALS__ || !token) return;

    runtime.__TAURI_INTERNALS__ = {
        invoke: async (command, args = {}) => {
            if (command === "plugin:opener|open_url") {
                const url = argument(args, "url");
                if (typeof url === "string") {
                    globalThis.open(url, "_blank", "noopener,noreferrer");
                }
                return null;
            }

            const response = await fetch(`/__livery/invoke/${command}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-livery-dev-token": token,
                },
                body: JSON.stringify(args),
            });
            const body: unknown = await response.json();
            if (!response.ok) {
                const message = argument(body, "error");
                throw typeof message === "string" ? message : "Development bridge request failed";
            }
            return body;
        },
        plugins: {
            path: {
                delimiter: ":",
                sep: "/",
            },
        },
    };
}

installDevBridge();
