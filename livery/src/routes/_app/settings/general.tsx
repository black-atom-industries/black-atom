import { createFileRoute } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useConfig } from "../../../queries/use-config.ts";
import { GeneralPanel } from "../../../components/settings/general-panel/index.ts";
import denoConfig from "../../../../deno.json" with { type: "json" };

export const Route = createFileRoute("/_app/settings/general")({
    component: GeneralRoute,
});

function GeneralRoute() {
    const config = useConfig();

    function toggleSystemAppearance() {
        const data = config.query.data;
        if (!data) return;
        void config.saveLatest((latest) => ({
            ...latest,
            system_appearance: !latest.system_appearance,
        })).catch((error) => {
            console.error("Could not save system appearance", error);
        });
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
