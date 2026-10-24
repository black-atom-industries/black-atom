import { useEffect, useMemo, useRef, useState } from "react";
import type * as Theme from "@black-atom/core";
import { useReducedMotion } from "#/hooks/use-reduced-motion.ts";
import { useRouteBackgroundState } from "#/hooks/use-route-background-state.ts";
import { backgroundStateKey } from "#/lib/route-background-state.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import type { BackgroundController } from "./controller.ts";
import { connectBackground } from "./handle.ts";
import styles from "./background-layer.module.css";

/** The fixed scene behind every page. Renders an empty host on the server; the scene loads on the client. */
export function BackgroundLayer({ theme }: { theme: Theme.Definition }) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [controller, setController] = useState<BackgroundController>();
    const state = useRouteBackgroundState();
    const isStill = useReducedMotion();
    const sceneTheme = useMemo(
        () => ({ vars: themeToCustomProperties(theme), appearance: theme.meta.appearance }),
        [theme],
    );

    useEffect(() => {
        const host = hostRef.current;
        // Effects never run on the server, but without this constant the server build bundles three.
        if (import.meta.env.SSR || !host) return;
        let created: BackgroundController | undefined;
        let disconnect: (() => void) | undefined;
        let isCancelled = false;
        void import("./controller.ts").then(({ createBackgroundController }) => {
            if (isCancelled) return;
            created = createBackgroundController(host);
            disconnect = connectBackground(created);
            setController(created);
        });
        return () => {
            isCancelled = true;
            disconnect?.();
            created?.dispose();
        };
    }, []);

    useEffect(() => {
        controller?.update({ state, theme: sceneTheme, isStill });
    }, [controller, state, sceneTheme, isStill]);

    return (
        <div
            ref={hostRef}
            data-component="BackgroundLayer"
            className={styles.layer}
            data-state={backgroundStateKey(state)}
            data-mode={state.mode}
            aria-hidden
        />
    );
}
