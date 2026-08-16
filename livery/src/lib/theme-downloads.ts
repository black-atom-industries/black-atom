import {
    type AdapterThemesStatus,
    type AppName,
    commands,
    type DownloadResult as BackendDownloadResult,
} from "../bindings.ts";

/** Frontend-extended result that allows UI-only statuses — mirrors updaters.ts. */
export type DownloadRowResult = Omit<BackendDownloadResult, "status"> & {
    status: BackendDownloadResult["status"] | "pending" | "running";
};

/** Apps with anything to fetch — External adapters provision their own files. */
export function downloadableApps(
    adapters: Partial<Record<AppName, AdapterThemesStatus>>,
): AppName[] {
    return (Object.entries(adapters) as [AppName, AdapterThemesStatus][])
        .filter(([, status]) => status.provisioning !== "external")
        .map(([app]) => app);
}

/** Downloadable adapters whose managed files are not present yet. */
export function missingDownloadableApps(
    adapters: Partial<Record<AppName, AdapterThemesStatus>>,
): AppName[] {
    return (Object.entries(adapters) as [AppName, AdapterThemesStatus][])
        .filter(([, status]) => status.provisioning !== "external" && !status.downloaded)
        .map(([app]) => app);
}

/** Pending rows for a download pass, in stable alphabetical order. */
export function initialDownloadRows(apps: AppName[]): DownloadRowResult[] {
    return [...apps].sort().map((app) => ({
        app,
        status: "pending",
        file_count: null,
        duration_ms: null,
    }));
}

export function hasDownloadErrors(results: DownloadRowResult[] | null): boolean {
    return results?.some((r) => r.status === "error") ?? false;
}

/** `LAST SYNCED …` display value from manifest epoch seconds, local time. */
export function formatFetchedAt(epochSeconds: number): string {
    const d = new Date(epochSeconds * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${
        pad(d.getMinutes())
    }`;
}

/** Newest fetch across adapters, or null when nothing was ever downloaded. */
export function latestFetchedAtEpoch(
    adapters: Partial<Record<AppName, AdapterThemesStatus>>,
): number | null {
    const epochs = Object.values(adapters)
        .flatMap((a) => a?.fetched_at_epoch != null ? [a.fetched_at_epoch] : []);
    return epochs.length ? Math.max(...epochs) : null;
}

/**
 * Download each adapter's themes sequentially, calling onUpdate after every
 * status change — the download analog of applyTheme in updaters.ts.
 */
export async function downloadThemes(
    apps: AppName[],
    onUpdate: (results: DownloadRowResult[]) => void,
): Promise<DownloadRowResult[]> {
    const sorted = [...apps].sort();
    const results = initialDownloadRows(sorted);
    onUpdate([...results]);

    for (let i = 0; i < sorted.length; i++) {
        results[i] = { ...results[i], status: "running" };
        onUpdate([...results]);

        try {
            results[i] = await commands.downloadTheme(sorted[i]);
        } catch (error) {
            results[i] = {
                app: sorted[i],
                status: "error",
                message: error instanceof Error ? error.message : String(error),
                file_count: null,
                duration_ms: null,
            };
        }
        onUpdate([...results]);
    }

    return results;
}
