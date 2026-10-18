import { createFileRoute } from "@tanstack/react-router";
import { useConfig } from "../../../queries/use-config.ts";
import { GeneralPanel } from "../../../components/settings/general-panel/index.ts";
import packageJson from "../../../../package.json" with { type: "json" };
import { useSettingsContext } from "./-settings-context.ts";

export const Route = createFileRoute("/_app/settings/general")({
    component: GeneralRoute,
});

function GeneralRoute() {
    const config = useConfig();
    const { onToggleSystemAppearance } = useSettingsContext();

    if (!config.query.data) return null;

    return (
        <GeneralPanel
            followOsAppearance={config.query.data.system_appearance}
            onToggleFollowOsAppearance={onToggleSystemAppearance}
            liveryVersion={packageJson.version}
            cursored
        />
    );
}
