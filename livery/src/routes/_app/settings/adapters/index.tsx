import { createFileRoute } from "@tanstack/react-router";
import { useConfig } from "../../../../queries/use-config.ts";
import { Button } from "../../../../components/primitives/button/button.tsx";
import { Typo } from "../../../../components/typo/index.ts";
import { useSettingsContext } from "../-settings-context.ts";
import styles from "./index.module.css";

export const Route = createFileRoute("/_app/settings/adapters/")({
    component: AdaptersIndexRoute,
});

function AdaptersIndexRoute() {
    const config = useConfig();
    const ctx = useSettingsContext();
    const adapterCount = config.query.data ? Object.keys(config.query.data.apps).length : 0;

    return (
        <div className={styles.root}>
            <Typo.Small color="hint">
                Scan for installed adapters, or pick one from the list to edit its settings.
            </Typo.Small>
            <div className={styles.detectRow}>
                <Button intent="secondary" onClick={ctx.onAutoDetect} disabled={ctx.detecting}>
                    {ctx.detecting ? "DETECTING…" : "AUTO-DETECT"}
                </Button>
                {ctx.detectError
                    ? <span className={styles.detectError}>DETECT FAILED: {ctx.detectError}</span>
                    : ctx.detections
                    ? (
                        <span className={styles.detectMeta}>
                            {Object.values(ctx.detections).filter(Boolean).length} OF {adapterCount}
                            {" "}
                            FOUND
                        </span>
                    )
                    : null}
            </div>
        </div>
    );
}
