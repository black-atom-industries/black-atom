import type { AppConfig, AppName } from "../../../bindings.ts";
import { StatusPip } from "../../primitives/status-pip/status-pip.tsx";
import { Toggle } from "../../primitives/toggle/toggle.tsx";
import { verifyFaultLabel, type VerifyPathResult } from "./results.ts";
import styles from "./adapter-shared.module.css";

type Props = {
    appName: AppName;
    appConfig: AppConfig;
    detected: boolean;
    onToggleEnabled: () => void;
    verifyPathResult?: VerifyPathResult;
};

/** Adapter name + enable toggle + status pip. CONFIG_PATH lives in the
    field grid below, not duplicated here. */
export function AdapterHeader(
    { appName, appConfig, detected, onToggleEnabled, verifyPathResult }: Props,
) {
    const enabled = appConfig.enabled !== false;
    const fault = verifyFaultLabel(verifyPathResult);

    return (
        <div className={styles.header}>
            <Toggle on={enabled} onChange={onToggleEnabled} />
            <span className={enabled ? styles.nameEnabled : styles.name}>{appName}</span>
            {fault && <span className={styles.pathFault}>{fault}</span>}
            <span className={styles.headerSpacer} />
            {detected && !enabled && <StatusPip intent="warn">FOUND</StatusPip>}
            {enabled && fault
                ? <StatusPip intent="warn">CHECK</StatusPip>
                : (
                    <StatusPip intent={enabled ? "ok" : "off"}>
                        {enabled ? "OK" : "DISABLED"}
                    </StatusPip>
                )}
        </div>
    );
}
