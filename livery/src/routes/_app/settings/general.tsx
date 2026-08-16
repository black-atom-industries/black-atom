import { createFileRoute } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useConfig } from "../../../queries/use-config.ts";
import { GeneralPanel } from "../../../components/settings/general-panel/index.ts";
import type { Config } from "../../../bindings.ts";
import denoConfig from "../../../../deno.json" with { type: "json" };

export const Route = createFileRoute("/_app/settings/general")({
    component: GeneralRoute,
});

function GeneralRoute() {
    const config = useConfig();

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
            cursored
        />
    );
}
