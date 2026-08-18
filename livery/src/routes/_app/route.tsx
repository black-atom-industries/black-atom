import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useStore } from "@tanstack/react-store";
import { useMutationState } from "@tanstack/react-query";
import { collectionOrder, themeMap } from "@black-atom/core";
import denoConfig from "../../../deno.json" with { type: "json" };
import { AppHeader } from "../../components/app-header/index.ts";
import { AppFooter } from "../../components/app-footer/index.ts";
import { ApplyRail } from "../../components/apply-rail/index.ts";
import { KeyHint } from "../../components/primitives/key-hint/key-hint.tsx";
import { StatusPip } from "../../components/primitives/status-pip/status-pip.tsx";
import { themeToStyleSheet } from "../../lib/tokens.ts";
import { getFailedUpdaters, mergeUpdateResults, summarizeApply } from "../../lib/progress.ts";
import { defaultTheme } from "../../lib/themes.ts";
import {
    applyTheme,
    createUpdaters,
    getEnabledApps,
    type UpdateResult,
} from "../../lib/updaters.ts";
import { useConfig } from "../../queries/use-config.ts";
import { useActiveTheme } from "../../queries/use-active-theme.ts";
import { appStore } from "../../store/app.ts";
import styles from "./route.module.css";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout() {
    const config = useConfig();
    const phase = useStore(appStore, (s) => s.phase);
    const updaterResults = useStore(appStore, (s) => s.updaterResults);
    const applyingTheme = useStore(appStore, (s) => s.applyingTheme);
    const activeTheme = useActiveTheme();

    // livery wears the theme it applied, following the run while one is on
    // screen and the record once the rail is dismissed — a pass that wrote
    // nothing must not leave the app tinted as a theme the machine never got.
    // Falling back to default-dark covers a launch before setup ran.
    const displayedTheme = (phase === "picking" ? null : applyingTheme) ??
        activeTheme.theme ?? defaultTheme;

    const matches = useMatches();
    const isSettings = matches.some((m) => m.routeId === "/_app/settings");
    const settingsSection = matches.some((m) => m.routeId === "/_app/settings/general")
        ? "general"
        : "adapters";

    // Save mutation lives on the settings route's own useConfig() instance —
    // useMutationState reads the shared MutationCache by key instead of
    // threading mutation state up through props.
    const saveMutationStatuses = useMutationState({
        filters: { mutationKey: ["config", "save"] },
        select: (mutation) => mutation.state.status,
    });
    const latestSaveStatus = saveMutationStatuses.at(-1);
    const isSaving = latestSaveStatus === "pending";
    const justSaved = latestSaveStatus === "success";

    const themeCount = useMemo(() => Object.keys(themeMap).length, []);
    const collectionCount = collectionOrder.length;
    const env = displayedTheme.meta.appearance.toUpperCase();

    const summary = summarizeApply(updaterResults);
    const railKeysActive = phase !== "picking" && !isSettings;

    // The rail is permanently docked. Idle (nothing applied yet) previews
    // the enabled adapters as pending rows — what an apply will touch.
    const railMode = phase !== "picking"
        ? "active" as const
        : updaterResults.length > 0
        ? "settled" as const
        : "idle" as const;
    const idleRows = useMemo<UpdateResult[]>(
        () =>
            config.query.data
                ? getEnabledApps(config.query.data.apps).map(([app]) => ({
                    app,
                    status: "pending",
                    duration_ms: null,
                }))
                : [],
        [config.query.data],
    );
    const railResults = updaterResults.length > 0 ? updaterResults : idleRows;

    // Rail cursor + expansion. The cursor follows the running row, then the
    // first fault, until j/k takes over; a new apply pass resets both.
    const [manualCursor, setManualCursor] = useState<number | null>(null);
    const [expandedApp, setExpandedApp] = useState<UpdateResult["app"] | null>(null);
    const [prevPhase, setPrevPhase] = useState(phase);
    if (phase !== prevPhase) {
        setPrevPhase(phase);
        if (phase === "applying") {
            setManualCursor(null);
            setExpandedApp(null);
        }
    }

    const runningIndex = updaterResults.findIndex((r) => r.status === "running");
    const firstFaultIndex = updaterResults.findIndex(
        (r) => r.status === "error" || (r.status === "skipped" && r.message),
    );
    const cursorIndex = manualCursor ?? (runningIndex !== -1 ? runningIndex : firstFaultIndex);
    const cursorResult = cursorIndex >= 0 ? updaterResults[cursorIndex] : undefined;

    const moveRailCursor = (delta: number) => {
        if (updaterResults.length === 0) return;
        const from = cursorIndex >= 0 ? cursorIndex : delta > 0 ? -1 : updaterResults.length;
        setManualCursor(Math.max(0, Math.min(updaterResults.length - 1, from + delta)));
    };

    const toggleCursoredRow = (app?: UpdateResult["app"]) => {
        const target = app ?? (cursorResult?.status === "error" ? cursorResult.app : undefined);
        if (!target) return;
        setExpandedApp((current) => (current === target ? null : target));
    };

    // The rail never hides — settling only hands the keyboard back to the
    // picking list; the last results stay on display.
    const settleRail = () => appStore.setState((s) => ({ ...s, phase: "picking" }));

    // Clean success holds the ■ APPLIED beat, then settles itself —
    // nothing to acknowledge. Faults never settle on a timer.
    useEffect(() => {
        if (phase !== "done" || summary.kind !== "clean") return;
        const beat = setTimeout(settleRail, 1200);
        return () => clearTimeout(beat);
    }, [phase, summary.kind]);

    const handleRetryFailed = async () => {
        if (!config.query.data) return;

        const failedApps = getFailedUpdaters(updaterResults);
        if (failedApps.length === 0) return;

        if (!applyingTheme) return;

        const enabledApps = getEnabledApps(config.query.data.apps)
            .filter(([name]) => failedApps.includes(name));
        const retryUpdaters = createUpdaters(enabledApps, applyingTheme.meta);

        appStore.setState((s) => ({
            ...s,
            phase: "applying",
            updaterResults: mergeUpdateResults(
                s.updaterResults,
                retryUpdaters.map((u) => ({ app: u.app, status: "pending", duration_ms: null })),
            ),
        }));

        try {
            const results = await applyTheme(retryUpdaters, (partial) => {
                appStore.setState((s) => ({
                    ...s,
                    updaterResults: mergeUpdateResults(s.updaterResults, partial),
                }));
            });

            // A retry is where the record is most likely to be stale: it only
            // runs after a failed pass, which left the previous theme recorded.
            if (results.some((result) => result.status === "done")) {
                try {
                    await activeTheme.set.mutateAsync(applyingTheme.meta.key);
                } catch (error) {
                    console.warn("[active theme]", error);
                }
            }
        } finally {
            appStore.setState((s) => ({ ...s, phase: "done" }));
        }
    };

    useHotkey("R", handleRetryFailed);
    useHotkey("J", () => railKeysActive && moveRailCursor(1));
    useHotkey("K", () => railKeysActive && moveRailCursor(-1));
    useHotkey("Enter", () => railKeysActive && toggleCursoredRow());
    useHotkey("Escape", () => railKeysActive && phase !== "applying" && settleRail());

    const themeName = displayedTheme.meta.name.toUpperCase();

    return (
        <>
            <style id="black-atom-theme-tokens">{themeToStyleSheet(displayedTheme)}</style>
            <div className={styles.root}>
                <header className={styles.header}>
                    <AppHeader
                        version={denoConfig.version}
                        context={isSettings
                            ? `SETTINGS / ${settingsSection.toUpperCase()}`
                            : `${themeCount} THEMES · ${collectionCount} COLLECTIONS · ENV ${env}`}
                    />
                </header>
                <main className={styles.main}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                    {!isSettings && (
                        <aside className={styles.rail}>
                            <ApplyRail
                                mode={railMode}
                                themeName={themeName}
                                results={railResults}
                                cursorApp={railMode === "active" ? cursorResult?.app ?? null : null}
                                expandedApp={expandedApp}
                                onToggleRow={toggleCursoredRow}
                                onRetryFailed={handleRetryFailed}
                            />
                        </aside>
                    )}
                </main>
                <footer className={styles.footer}>
                    <AppFooter
                        hints={isSettings
                            ? (
                                <>
                                    <KeyHint keys="j/k">ROWS</KeyHint>
                                    <KeyHint keys="space">TOGGLE</KeyHint>
                                    <KeyHint keys="⏎">EDIT FIELD</KeyHint>
                                    <KeyHint keys="esc">BACK</KeyHint>
                                </>
                            )
                            : (
                                <>
                                    <KeyHint keys="j/k">NAVIGATE</KeyHint>
                                    <KeyHint keys="/">SEARCH</KeyHint>
                                    <KeyHint keys="f">FILTERS</KeyHint>
                                    <KeyHint keys="⏎">APPLY</KeyHint>
                                    <KeyHint keys="s">SETTINGS</KeyHint>
                                    <KeyHint keys="q">QUIT</KeyHint>
                                </>
                            )}
                        status={isSettings && isSaving
                            ? <StatusPip intent="running">SAVING…</StatusPip>
                            : isSettings && justSaved
                            ? <StatusPip intent="ok">SAVED</StatusPip>
                            : <StatusPip intent="ok">READY</StatusPip>}
                    />
                </footer>
            </div>
        </>
    );
}
