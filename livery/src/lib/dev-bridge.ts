type DevBridgeInternals = {
    invoke: (command: string, args?: unknown) => Promise<unknown>;
    transformCallback: (callback: (message: unknown) => void) => number;
    unregisterCallback: (id: number) => void;
    plugins: {
        path: {
            delimiter: string;
            sep: string;
        };
    };
};

type BrowserRuntime = typeof globalThis & {
    __TAURI_INTERNALS__?: DevBridgeInternals;
    __TAURI_EVENT_PLUGIN_INTERNALS__?: { unregisterListener: () => void };
};

const CONFIG_FILE_EVENT = "config-file-changed";
const EVENT_POLL_MS = 100;

function argument(value: unknown, name: string): unknown {
    if (typeof value !== "object" || value === null) return undefined;
    return Reflect.get(value, name);
}

function installDevBridge() {
    const runtime = globalThis as BrowserRuntime;
    const token = import.meta.env.VITE_LIVERY_DEV_BRIDGE_TOKEN;

    if (runtime.__TAURI_INTERNALS__ || !token) return;

    const callbacks = new Map<number, (message: unknown) => void>();
    const listeners = new Map<number, number>();
    let nextId = 1;
    let polling = false;

    async function callBridge(command: string, args: unknown): Promise<unknown> {
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
    }

    /** The bridge has no Tauri event channel, so its queue is polled and replayed. */
    async function pollEvents(after: number | null) {
        const body = await callBridge("config_file_events", { after }).catch(() => null);
        const events = argument(body, "events");
        for (const payload of Array.isArray(events) ? events : []) {
            for (const [id, handler] of listeners) {
                callbacks.get(handler)?.({ event: CONFIG_FILE_EVENT, id, payload });
            }
        }
        const next = argument(body, "next");
        setTimeout(() => void pollEvents(typeof next === "number" ? next : after), EVENT_POLL_MS);
    }

    runtime.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
    runtime.__TAURI_INTERNALS__ = {
        transformCallback: (callback) => {
            const id = nextId++;
            callbacks.set(id, callback);
            return id;
        },
        unregisterCallback: (id) => {
            callbacks.delete(id);
        },
        invoke: async (command, args = {}) => {
            if (command === "plugin:event|listen") {
                const id = nextId++;
                listeners.set(id, Number(argument(args, "handler")));
                if (!polling) {
                    polling = true;
                    void pollEvents(null);
                }
                return id;
            }
            if (command === "plugin:event|unlisten") {
                listeners.delete(Number(argument(args, "eventId")));
                return null;
            }
            if (command === "plugin:opener|open_url") {
                const url = argument(args, "url");
                if (typeof url === "string") {
                    globalThis.open(url, "_blank", "noopener,noreferrer");
                }
                return null;
            }

            return callBridge(command, args);
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
