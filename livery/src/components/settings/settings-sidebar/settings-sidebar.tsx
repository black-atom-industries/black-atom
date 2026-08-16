import { useMatches, useNavigate } from "@tanstack/react-router";
import type { AppConfig, AppName } from "../../../bindings.ts";
import { ListRow } from "../../primitives/list-row/list-row.tsx";
import { StatusPip } from "../../primitives/status-pip/status-pip.tsx";
import { verifyFaultLabel } from "../adapter-shared/results.ts";
import type { VerifyPathResult } from "../adapter-shared/results.ts";
import styles from "./settings-sidebar.module.css";

type Props = {
    appEntries: [AppName, AppConfig][];
    detectedApps: ReadonlySet<AppName> | null;
    verifyPathResults: Partial<Record<AppName, VerifyPathResult>>;
};

/**
 * Settings left panel — THEMES reads as an exit back to the main view;
 * GENERAL and ADAPTERS are settings-section peers. The adapter list under
 * ADAPTERS is always visible (no collapse/disclosure), permanently indented.
 * AUTO-DETECT lives on the ADAPTERS index page, not here. Position is shown
 * entirely via route-derived `selected` styling — no DOM focus is moved
 * around, since that fights `:focus-visible` heuristics for no benefit
 * (hotkeys are registered on `document`, not scoped to a focused row).
 */
export function SettingsSidebar(
    { appEntries, detectedApps, verifyPathResults }: Props,
) {
    const navigate = useNavigate();
    const matches = useMatches();
    const onGeneral = matches.some((m) => m.routeId === "/_app/settings/general");
    const selectedAdapter = matches.find(
        (m) => m.routeId === "/_app/settings/adapters/$adapter",
    )?.params as { adapter?: AppName } | undefined;
    // ADAPTERS reads as fully selected only at its own index (no adapter
    // picked yet) — once a specific adapter is selected, that row carries
    // the selection and ADAPTERS steps back to an unselected ancestor.
    const onAdaptersIndex = !onGeneral && !selectedAdapter?.adapter;

    return (
        <div className={styles.root}>
            <button type="button" className={styles.back} onClick={() => navigate({ to: "/" })}>
                ‹ THEMES
            </button>

            <ListRow
                name="GENERAL"
                selected={onGeneral}
                onClick={() => navigate({ to: "/settings/general" })}
            />

            <ListRow
                name="ADAPTERS"
                selected={onAdaptersIndex}
                onClick={() => navigate({ to: "/settings/adapters" })}
            />
            {appEntries.map(([appName, appConfig]) => {
                const enabled = appConfig.enabled !== false;
                const fault = verifyFaultLabel(verifyPathResults[appName]);
                const detected = detectedApps?.has(appName) ?? false;
                const isSelected = selectedAdapter?.adapter === appName;

                return (
                    <ListRow
                        key={appName}
                        name={appName}
                        indented
                        selected={isSelected}
                        onClick={() =>
                            navigate({
                                to: "/settings/adapters/$adapter",
                                params: { adapter: appName },
                            })}
                        trailing={
                            <span className={styles.badges}>
                                {detected && !enabled && <StatusPip intent="warn">FOUND</StatusPip>}
                                {enabled && fault
                                    ? <StatusPip intent="warn">CHECK</StatusPip>
                                    : (
                                        <StatusPip intent={enabled ? "ok" : "off"}>
                                            {enabled ? "OK" : "DISABLED"}
                                        </StatusPip>
                                    )}
                            </span>
                        }
                    />
                );
            })}
        </div>
    );
}
