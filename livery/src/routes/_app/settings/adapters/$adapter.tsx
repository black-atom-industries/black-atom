import { createFileRoute, notFound } from "@tanstack/react-router";
import { useConfig } from "../../../../queries/use-config.ts";
import { adapterSettingsPages } from "../../../../components/settings/adapter-pages/index.ts";
import type { AppName } from "../../../../bindings.ts";
import { useSettingsContext } from "../-settings-context.ts";

function isAppName(value: string): value is AppName {
    return Object.hasOwn(adapterSettingsPages, value);
}

export const Route = createFileRoute("/_app/settings/adapters/$adapter")({
    params: {
        parse: (raw) => {
            if (!isAppName(raw.adapter)) throw notFound();
            return { adapter: raw.adapter };
        },
        stringify: (parsed) => ({ adapter: parsed.adapter }),
    },
    component: AdapterDetailRoute,
});

function AdapterDetailRoute() {
    const { adapter } = Route.useParams();
    const config = useConfig();
    const ctx = useSettingsContext();

    const appConfig = config.query.data?.apps[adapter];
    const AdapterSettings = adapterSettingsPages[adapter];
    if (!appConfig) return null;

    const detected = ctx.detections?.[adapter] ?? false;

    return (
        <AdapterSettings
            appConfig={appConfig}
            editableFields={ctx.editableFieldsByApp[adapter] ?? new Set()}
            detected={detected}
            onToggleEnabled={() => ctx.onToggleEnabled(adapter)}
            onFieldCommit={(field, value) => ctx.onFieldCommit(adapter, field, value)}
            firstFieldRef={ctx.firstFieldRef}
            onPickPath={ctx.onPickPath}
            onOpenUrl={ctx.onOpenUrl}
            onSetUp={() => ctx.onSetUp(adapter)}
            setUpResult={ctx.setUpResults[adapter]}
            onVerifyPath={() => ctx.onVerifyPath(adapter)}
            verifyPathResult={ctx.verifyPathResults[adapter]}
            linkable={ctx.linkableApps.has(adapter)}
            onLinkThemes={() => ctx.onLinkThemes(adapter)}
            linkThemesResult={ctx.linkThemesResults[adapter]}
            onTestApply={() => ctx.onTestApply(adapter)}
            testApplyResult={ctx.testApplyResults[adapter]}
        />
    );
}
