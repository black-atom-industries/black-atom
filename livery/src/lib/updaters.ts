import type { ThemeMeta } from "@black-atom/core";
import {
    type AppConfig,
    type AppName,
    commands,
    type UpdateResult as BackendUpdateResult,
    type UpdateStatus as BackendUpdateStatus,
} from "../bindings.ts";

/** Frontend-extended status includes "pending" and "running" (UI-only states). */
export type UpdateStatus = BackendUpdateStatus | "pending" | "running";

/** Frontend-extended result that allows UI-only statuses. */
export type UpdateResult = Omit<BackendUpdateResult, "status"> & { status: UpdateStatus };

export interface UpdaterEntry {
    app: AppName;
    run: () => Promise<BackendUpdateResult>;
}

/** Filter apps that are enabled in the config. Enabled defaults to true if omitted. */
export function getEnabledApps(
    apps: Partial<Record<AppName, AppConfig>>,
): [AppName, AppConfig][] {
    return (Object.entries(apps) as [AppName, AppConfig][])
        .filter(([_name, app]) => app && app.enabled !== false);
}

/** Build runnable updaters from enabled apps and theme metadata. */
export function createUpdaters(
    enabledApps: [AppName, AppConfig][],
    themeMeta: ThemeMeta,
): UpdaterEntry[] {
    return enabledApps.map(([appName]) => ({
        app: appName,
        run: async (): Promise<BackendUpdateResult> => {
            try {
                return await commands.updateApp(appName, {
                    theme_key: themeMeta.key,
                    appearance: themeMeta.appearance,
                    collection_key: themeMeta.collection.key,
                    theme_label: themeMeta.label,
                });
            } catch (error) {
                const raw = error instanceof Error ? error.message : String(error);
                const message = raw.includes("invalid value")
                    ? `App "${appName}" is not recognized by the backend. Is AppName in sync?`
                    : raw;
                return { app: appName, status: "error", message, duration_ms: null };
            }
        },
    }));
}

/** Run updaters sequentially, calling onUpdate after each status change. */
export async function applyTheme(
    updaters: UpdaterEntry[],
    onUpdate: (results: UpdateResult[]) => void,
): Promise<void> {
    const results: UpdateResult[] = updaters.map<UpdateResult>((u) => ({
        app: u.app,
        status: "pending",
        duration_ms: null,
    }));

    onUpdate(results);

    for (let i = 0; i < updaters.length; i++) {
        results[i] = { app: updaters[i].app, status: "running", duration_ms: null };
        onUpdate([...results]);

        results[i] = await updaters[i].run();
        onUpdate([...results]);
    }
}
