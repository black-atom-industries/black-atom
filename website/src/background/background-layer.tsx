import { useEffect, useMemo, useRef, useState } from "react";
import type * as Theme from "@black-atom/core";
import { BackgroundFallback } from "#/components/background-fallback/index.ts";
import { useReducedMotion } from "#/hooks/use-reduced-motion.ts";
import { useRouteBackgroundState } from "#/hooks/use-route-background-state.ts";
import { backgroundStateKey } from "#/lib/route-background-state.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import type { BackgroundController } from "./controller.ts";
import { createGrain, grainFrameMs, type Grain } from "./grain.ts";
import { connectBackground } from "./handle.ts";
import styles from "./background-layer.module.css";

/**
 * The fixed scene behind every page, under the film grain. Renders an empty host on the server;
 * the scene loads on the client, and a still outline of the landmark stands in when it can't run.
 */
export function BackgroundLayer({ theme }: { theme: Theme.Definition }) {
    const hostRef = useRef<HTMLDivElement>(null);
    const grainRef = useRef<Grain>(undefined);
    const [controller, setController] = useState<BackgroundController>();
    const [hasFailed, setHasFailed] = useState(false);
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
            const next = createBackgroundController(host);
            created = next;
            const disconnectEvents = connectBackground(next);
            const stopWatching = next.onFail(() => setHasFailed(true));
            disconnect = () => {
                stopWatching();
                disconnectEvents();
            };
            setController(next);
        });
        return () => {
            isCancelled = true;
            disconnect?.();
            created?.dispose();
        };
    }, []);

    useEffect(() => {
        const grain = createGrain();
        grainRef.current = grain;
        return () => {
            grainRef.current = undefined;
            grain.dispose();
        };
    }, []);

    useEffect(() => {
        grainRef.current?.setLight(sceneTheme.appearance === "light");
    }, [sceneTheme.appearance]);

    useEffect(() => {
        if (isStill) return;
        const timer = window.setInterval(
            () => grainRef.current?.tick(performance.now()),
            grainFrameMs,
        );
        return () => clearInterval(timer);
    }, [isStill]);

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
        >
            {hasFailed && (
                <BackgroundFallback view={state.view} isReceded={state.mode === "receded"} />
            )}
        </div>
    );
}
