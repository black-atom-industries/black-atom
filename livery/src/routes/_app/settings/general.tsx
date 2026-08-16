import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useConfig } from "../../../queries/use-config.ts";
import { useThemesStatus } from "../../../queries/use-themes-status.ts";
import {
    downloadableApps,
    type DownloadRowResult,
    downloadThemes,
    latestFetchedAtEpoch,
} from "../../../lib/theme-downloads.ts";
import { GeneralPanel } from "../../../components/settings/general-panel/index.ts";
import type { Config } from "../../../bindings.ts";
import denoConfig from "../../../../deno.json" with { type: "json" };

export const Route = createFileRoute("/_app/settings/general")({
    component: GeneralRoute,
});

function GeneralRoute() {
    const config = useConfig();
    const themesStatus = useThemesStatus();
    const [syncResults, setSyncResults] = useState<DownloadRowResult[] | null>(null);
    const [syncing, setSyncing] = useState(false);

    async function syncThemes() {
        if (syncing) return;
        setSyncing(true);
        try {
            let adapters = themesStatus.query.data?.adapters;
            if (!adapters) adapters = (await themesStatus.query.refetch()).data?.adapters;
            if (!adapters) return;
            await downloadThemes(downloadableApps(adapters), setSyncResults);
        } finally {
            setSyncing(false);
            themesStatus.query.refetch();
        }
    }

    function toggleSystemAppearance() {
        const data = config.query.data;
        if (!data) return;
        const next: Config = { ...data, system_appearance: !data.system_appearance };
        config.save.mutate(next);
    }

    useHotkey("Space", toggleSystemAppearance);

    if (!config.query.data) return null;

    return (
        <GeneralPanel
            followOsAppearance={config.query.data.system_appearance}
            onToggleFollowOsAppearance={toggleSystemAppearance}
            liveryVersion={denoConfig.version}
            themesLastSyncedEpoch={latestFetchedAtEpoch(themesStatus.query.data?.adapters ?? {})}
            syncResults={syncResults}
            syncing={syncing}
            onSyncThemes={syncThemes}
            cursored
        />
    );
}
