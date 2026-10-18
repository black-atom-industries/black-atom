import { useMemo } from "react";
import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useMutationState } from "@tanstack/react-query";
import { collectionOrder, themeCatalog } from "@black-atom/core";
import packageJson from "../../../package.json" with { type: "json" };
import { AppHeader } from "../../components/app-header/index.ts";
import { AppFooter } from "../../components/app-footer/index.ts";
import { KeyHint } from "../../components/primitives/key-hint/key-hint.tsx";
import { StatusPip } from "../../components/primitives/status-pip/status-pip.tsx";
import { themeToStyleSheet } from "../../lib/tokens.ts";
import { useDisplayedTheme } from "./-use-displayed-theme.ts";
import styles from "./route.module.css";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout() {
    const displayedTheme = useDisplayedTheme();

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

    const themeCount = useMemo(() => Object.keys(themeCatalog).length, []);
    const collectionCount = collectionOrder.length;
    const env = displayedTheme.meta.appearance.toUpperCase();

    return (
        <>
            <style id="black-atom-theme-tokens">{themeToStyleSheet(displayedTheme)}</style>
            <div className={styles.root}>
                <header className={styles.header}>
                    <AppHeader
                        version={packageJson.version}
                        context={
                            isSettings
                                ? `SETTINGS / ${settingsSection.toUpperCase()}`
                                : `${themeCount} THEMES · ${collectionCount} COLLECTIONS · ENV ${env}`
                        }
                    />
                </header>
                <main className={styles.main}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                </main>
                <footer className={styles.footer}>
                    <AppFooter
                        hints={
                            isSettings ? (
                                <>
                                    <KeyHint keys="j/k">ROWS</KeyHint>
                                    <KeyHint keys="space">TOGGLE</KeyHint>
                                    <KeyHint keys="⏎">EDIT FIELD</KeyHint>
                                    <KeyHint keys="esc">BACK</KeyHint>
                                </>
                            ) : (
                                <>
                                    <KeyHint keys="j/k">NAVIGATE</KeyHint>
                                    <KeyHint keys="/">SEARCH</KeyHint>
                                    <KeyHint keys="f">FILTERS</KeyHint>
                                    <KeyHint keys="⏎">APPLY</KeyHint>
                                    <KeyHint keys="s">SETTINGS</KeyHint>
                                    <KeyHint keys="q">QUIT</KeyHint>
                                </>
                            )
                        }
                        status={
                            isSettings && isSaving ? (
                                <StatusPip intent="running">SAVING…</StatusPip>
                            ) : isSettings && justSaved ? (
                                <StatusPip intent="ok">SAVED</StatusPip>
                            ) : (
                                <StatusPip intent="ok">READY</StatusPip>
                            )
                        }
                    />
                </footer>
            </div>
        </>
    );
}
