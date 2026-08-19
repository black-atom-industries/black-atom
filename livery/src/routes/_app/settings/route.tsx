import { useRef, useState } from "react";
import { createFileRoute, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { themeMap } from "@black-atom/core";
import { Typo } from "../../../components/typo/index.ts";
import { useConfig } from "../../../queries/use-config.ts";
import { useAppStatus } from "../../../queries/use-app-status.ts";
import { useActiveTheme } from "../../../queries/use-active-theme.ts";
import { defaultTheme, pickRandomOtherTheme } from "../../../lib/themes.ts";
import { App } from "../../../components/layouts/app.ts";
import { SettingsSidebar } from "../../../components/settings/settings-sidebar/index.ts";
import type { AdapterField } from "../../../components/settings/adapter-pages/index.ts";
import type {
    LinkThemesRowResult,
    PathKind,
    TestApplyResult,
    VerifyPathResult,
} from "../../../components/settings/adapter-shared/index.ts";
import { commands } from "../../../bindings.ts";
import type {
    AdapterEditableField,
    AppConfig,
    AppName,
    NvimSettings,
    ThemeProvisioning,
    UpdateResult,
} from "../../../bindings.ts";
import { homeDir, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { setUpAdapter, type SetUpOutcome } from "../../../lib/adapter-setup.ts";
import { SettingsContext, type SettingsContextValue } from "./-settings-context.ts";
import styles from "./route.module.css";

/** How long a TEST APPLY probe theme stays applied before reverting. */
const TEST_APPLY_REVERT_DELAY_MS = 3000;

export const Route = createFileRoute("/_app/settings")({
    component: SettingsRoute,
});

function SettingsRoute() {
    const config = useConfig();
    const navigate = useNavigate();
    const matches = useMatches();
    const onGeneral = matches.some((m) => m.routeId === "/_app/settings/general");
    const onAdaptersSection = matches.some((m) => m.routeId.startsWith("/_app/settings/adapters"));
    const selectedAdapterMatch = matches.find(
        (m) => m.routeId === "/_app/settings/adapters/$adapter",
    )?.params as { adapter?: AppName } | undefined;
    const selectedApp = selectedAdapterMatch?.adapter;

    // Two keyboard levels, derived from the route (not separate state, so
    // clicking a sidebar row and using j/k never desync): "root" cycles
    // GENERAL/ADAPTERS; "detail" cycles adapters once a specific one is
    // selected.
    const navLevel: "root" | "detail" = selectedApp ? "detail" : "root";

    const firstFieldRef = useRef<HTMLInputElement>(null);
    const configFolderSavePending = useRef(0);
    const [configFoldersSaving, setConfigFoldersSaving] = useState(false);
    // Session-local TEST APPLY results — never persisted, starts empty.
    const [testApplyResults, setTestApplyResults] = useState<
        Partial<Record<AppName, TestApplyResult>>
    >({});
    // Session-local VERIFY PATH results — same lifetime as test applies.
    const [verifyPathResults, setVerifyPathResults] = useState<
        Partial<Record<AppName, VerifyPathResult>>
    >({});
    const appStatus = useAppStatus();
    // Session-local LINK THEMES results per adapter.
    const [linkThemesResults, setLinkThemesResults] = useState<
        Partial<Record<AppName, LinkThemesRowResult>>
    >({});
    const activeTheme = useActiveTheme();
    // Session-local SAVE SETTINGS outcome for the nvim page.
    const [nvimSettingsResult, setNvimSettingsResult] = useState<UpdateResult | undefined>(
        undefined,
    );

    // Linked adapters (symlink placement) — drives LINK THEMES visibility.
    const adapterEntries = appStatus.query.data ?? [];
    const linkableApps = new Set(
        adapterEntries.filter((status) => status.provisioning === "linked").map((s) => s.app),
    );
    const provisioningByApp = Object.fromEntries(
        adapterEntries.map((status) => [status.app, status.provisioning]),
    ) as Partial<Record<AppName, ThemeProvisioning>>;
    const editableFieldsByApp = Object.fromEntries(
        adapterEntries.map((status) => [status.app, new Set(status.editable_fields)]),
    ) as Partial<Record<AppName, ReadonlySet<AdapterEditableField>>>;

    // AUTO-DETECT scan — session-local, null until the first run.
    const [detecting, setDetecting] = useState(false);
    const [detections, setDetections] = useState<Partial<Record<AppName, boolean>> | null>(null);
    const [detectedConfigFolders, setDetectedConfigFolders] = useState<
        Partial<Record<AppName, string[]>>
    >({});
    const [detectError, setDetectError] = useState<string | null>(null);
    const [setUpResults, setSetUpResults] = useState<Partial<Record<AppName, SetUpOutcome>>>({});

    const detectedApps = detections
        ? new Set(
            (Object.entries(detections) as [AppName, boolean][])
                .filter(([, found]) => found)
                .map(([name]) => name),
        )
        : null;

    async function autoDetectApps() {
        if (detecting) return;
        setDetecting(true);
        try {
            const results = await commands.detectApps();
            setDetections(Object.fromEntries(results.map((d) => [d.app, d.found])));
            setDetectedConfigFolders(
                Object.fromEntries(
                    results
                        .filter((d) => d.config_folders)
                        .map((d) => [d.app, d.config_folders ?? []]),
                ),
            );
            setDetectError(null);
        } catch (error) {
            // A failed scan must never read as "scanned, found nothing".
            setDetections(null);
            setDetectedConfigFolders({});
            setDetectError(error instanceof Error ? error.message : String(error));
        } finally {
            setDetecting(false);
        }
    }

    /** SET UP — the class-appropriate chain, ending in the page's verify state. */
    async function setUpAdapterRow(appName: AppName) {
        const current = config.query.data;
        const provisioningClass = provisioningByApp[appName];
        if (!current || !provisioningClass) return;

        let configPath = appName === "obsidian"
            ? current.apps[appName]?.config_folders?.[0] ?? ""
            : current.apps[appName]?.config_path ?? "";
        if (appName === "obsidian") {
            const discovered = detectedConfigFolders.obsidian ?? [];
            if (discovered.length > 0) {
                const result = await config.saveLatest((latest) => {
                    const currentFolders = latest.apps.obsidian.config_folders ?? [];
                    const folders = [...currentFolders];
                    for (const folder of discovered) {
                        if (!folders.includes(folder)) folders.push(folder);
                    }
                    return {
                        ...latest,
                        apps: {
                            ...latest.apps,
                            obsidian: {
                                ...latest.apps.obsidian,
                                config_folders: folders,
                                config_path: null,
                            },
                        },
                    };
                });
                if (result.status === "error") throw new Error(result.error);
                configPath = discovered[0];
            }
        }

        const outcome = await setUpAdapter(
            appName,
            provisioningClass,
            configPath,
            {
                enable: async (app) => {
                    const result = await config.saveLatest((latest) => {
                        if (latest.apps[app]?.enabled) return latest;
                        return {
                            ...latest,
                            apps: {
                                ...latest.apps,
                                [app]: { ...latest.apps[app], enabled: true },
                            },
                        };
                    });
                    if (result.status === "error") throw new Error(result.error);
                },
                link: (app) => commands.linkAppThemes(app),
                verify: (app) => commands.verifyAppPath(app),
            },
            (partial) => setSetUpResults((prev) => ({ ...prev, [appName]: partial })),
        );
        // SET UP's own result line narrates the whole chain (including link
        // count and verify state via outcome.link/outcome.verify) — it does
        // not cross-populate the VERIFY PATH / LINK THEMES rows below, which
        // only reflect a direct run of those actions.
        setSetUpResults((prev) => ({ ...prev, [appName]: outcome }));
        appStatus.query.refetch();
    }

    async function linkAppThemes(appName: AppName) {
        setLinkThemesResults((prev) => ({ ...prev, [appName]: { status: "running" } }));
        try {
            const result = await commands.linkAppThemes(appName);
            const next: LinkThemesRowResult = result.status === "done"
                ? {
                    status: "ok",
                    linked: result.linked ?? 0,
                    pruned: result.pruned ?? 0,
                    message: result.message ?? null,
                    config_folders: result.config_folders ?? null,
                }
                : {
                    status: "error",
                    message: result.message ?? "Unknown error",
                    config_folders: result.config_folders ?? null,
                };
            setLinkThemesResults((prev) => ({ ...prev, [appName]: next }));
            appStatus.query.refetch();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setLinkThemesResults((prev) => ({
                ...prev,
                [appName]: { status: "error", message, config_folders: null },
            }));
        }
    }

    const data = config.query.data;
    const appEntries = (data ? Object.entries(data.apps) : []) as [AppName, AppConfig][];

    function toggleAppEnabled(appName: AppName) {
        if (!data) return;
        void config.saveLatest((latest) => ({
            ...latest,
            apps: {
                ...latest.apps,
                [appName]: {
                    ...latest.apps[appName],
                    enabled: latest.apps[appName].enabled === false,
                },
            },
        })).catch((error) => {
            console.error("Could not save adapter enabled state", error);
        });
    }

    function commitAdapterField(appName: AppName, field: AdapterField, value: string) {
        if (!data) return;
        void config.saveLatest((latest) => ({
            ...latest,
            apps: {
                ...latest.apps,
                [appName]: { ...latest.apps[appName], [field]: value },
            },
        })).catch((error) => {
            console.error("Could not save adapter field", error);
        });
    }

    function queueConfigFolderSave(change: (config_folders: string[]) => string[]) {
        configFolderSavePending.current += 1;
        setConfigFoldersSaving(true);
        const save = config.saveLatest((latest) => {
            const current = latest.apps.obsidian.config_folders ?? [];
            const nextConfigFolders = change(current);
            return {
                ...latest,
                apps: {
                    ...latest.apps,
                    obsidian: { ...latest.apps.obsidian, config_folders: nextConfigFolders },
                },
            };
        });
        save.catch((error) => {
            console.error("Could not save Obsidian config_folders", error);
        }).finally(() => {
            configFolderSavePending.current -= 1;
            if (configFolderSavePending.current === 0) setConfigFoldersSaving(false);
        });
    }

    function addConfigFolder(appName: AppName) {
        if (appName !== "obsidian") return;
        pickPath("directory").then((selected) => {
            if (!selected) return;
            const separator = sep();
            const name = selected.split(separator).at(-1) ?? "";
            const configFolder = name.startsWith(".")
                ? selected
                : `${selected}${separator}.obsidian`;
            queueConfigFolderSave((current) =>
                current.includes(configFolder) ? current : [...current, configFolder]
            );
        });
    }

    function removeConfigFolder(appName: AppName, config_folder: string) {
        if (appName !== "obsidian") return;
        queueConfigFolderSave((current) => current.filter((item) => item !== config_folder));
    }

    /**
     * TEST APPLY — applies a random *other* theme so the change is visible,
     * then reverts to the theme active before the test after a short delay.
     * Reverting is silent (the row just clears) — the steady state after a
     * test is "back to normal", not "still showing a stale test result".
     */
    async function testApplyAdapter(appName: AppName) {
        // Reverting has to land on what is genuinely applied. Before setup
        // has recorded anything there is nothing to revert to, so the probe
        // falls back to the same default setup would have seeded.
        const before = activeTheme.theme ?? defaultTheme;
        const probe = pickRandomOtherTheme(themeMap, before.meta.key);
        if (!probe) return;

        setTestApplyResults((prev) => ({ ...prev, [appName]: { status: "running" } }));
        try {
            const result = await commands.updateApp(appName, {
                theme_key: probe.meta.key,
                appearance: probe.meta.appearance,
                collection_key: probe.meta.collection.key,
                theme_label: probe.meta.label,
            });
            if (result.status !== "done") {
                setTestApplyResults((prev) => ({
                    ...prev,
                    [appName]: {
                        status: "error",
                        message: result.message ??
                            (result.status === "skipped" ? "Adapter skipped" : "Unknown error"),
                        config_folders: result.config_folders ?? null,
                    },
                }));
                return;
            }
            setTestApplyResults((prev) => ({
                ...prev,
                [appName]: {
                    status: "ok",
                    durationMs: result.duration_ms,
                    testedThemeLabel: probe.meta.label,
                    message: result.message ?? null,
                    config_folders: result.config_folders ?? null,
                },
            }));

            setTimeout(async () => {
                setTestApplyResults((prev) => ({ ...prev, [appName]: { status: "reverting" } }));
                try {
                    await commands.updateApp(appName, {
                        theme_key: before.meta.key,
                        appearance: before.meta.appearance,
                        collection_key: before.meta.collection.key,
                        theme_label: before.meta.label,
                    });
                } finally {
                    setTestApplyResults((prev) => {
                        const { [appName]: _discard, ...rest } = prev;
                        return rest;
                    });
                }
            }, TEST_APPLY_REVERT_DELAY_MS);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setTestApplyResults((prev) => ({
                ...prev,
                [appName]: { status: "error", message, config_folders: null },
            }));
        }
    }

    async function verifyAdapterPath(appName: AppName) {
        setVerifyPathResults((prev) => ({ ...prev, [appName]: { status: "running" } }));
        try {
            const result = await commands.verifyAppPath(appName);
            const next: VerifyPathResult = result.message != null
                ? { status: "unverifiable", message: result.message }
                : {
                    status: "verified",
                    exists: result.exists,
                    patternMatches: result.pattern_matches,
                    config_folders: result.config_folders,
                };
            setVerifyPathResults((prev) => ({ ...prev, [appName]: next }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setVerifyPathResults((prev) => ({
                ...prev,
                [appName]: { status: "unverifiable", message },
            }));
        }
    }

    /** Root level: j/k cycles GENERAL ↔ ADAPTERS (THEMES sits outside the
        cycle — it's the back/exit affordance, not a settings section). */
    function moveRootCursor(delta: number) {
        if (onGeneral && delta > 0) {
            navigate({ to: "/settings/adapters" });
        } else if (onAdaptersSection && delta < 0) {
            navigate({ to: "/settings/general" });
        }
    }

    /** Detail level: j/k cycles adapters, swapping the detail pane live. */
    function moveAdapterSelection(delta: number) {
        if (appEntries.length === 0) return;
        const currentIndex = selectedApp
            ? Math.max(0, appEntries.findIndex(([name]) => name === selectedApp))
            : delta > 0
            ? -1
            : appEntries.length;
        const nextIndex = Math.min(Math.max(0, appEntries.length - 1), currentIndex + delta);
        const entry = appEntries[nextIndex];
        if (entry) {
            navigate({
                to: "/settings/adapters/$adapter",
                params: { adapter: entry[0] },
                replace: true,
            });
        }
    }

    function moveSelection(delta: number) {
        if (navLevel === "root") moveRootCursor(delta);
        else moveAdapterSelection(delta);
    }

    function toggleSelected() {
        if (navLevel === "detail" && selectedApp) toggleAppEnabled(selectedApp);
    }

    /** Enter: on ADAPTERS at root, drill into the first adapter; on
        GENERAL, nothing to drill into. At detail, focus the first editable
        field (already inside an adapter page). */
    function handleEnter() {
        if (navLevel === "detail") {
            firstFieldRef.current?.focus();
            return;
        }
        if (onAdaptersSection && appEntries.length > 0) {
            navigate({
                to: "/settings/adapters/$adapter",
                params: { adapter: appEntries[0][0] },
            });
        }
    }

    /**
     * Escape: a dirty field reverts and stops propagation before this ever
     * runs (DraftField's own handler — `getDefaultIgnoreInputs` in
     * @tanstack/hotkeys special-cases Escape so it still reaches this
     * document-level hotkey from a focused input). From a clean field or
     * adapter detail, Escape ascends to root, landing on ADAPTERS — the
     * route-derived `selected` styling shows that, no DOM focus needed.
     * From root, Escape exits to THEMES.
     */
    function handleEscape() {
        if (navLevel === "detail") {
            navigate({ to: "/settings/adapters" });
            return;
        }
        navigate({ to: "/" });
    }

    /** nvim's plugin options: one backend write for config + Lua block. */
    function writeNvimSettings(settings: NvimSettings) {
        config.writeNvimSettings.mutate(settings, {
            onSuccess: setNvimSettingsResult,
            onError: (error) =>
                setNvimSettingsResult({
                    app: "nvim",
                    status: "error",
                    message: error instanceof Error ? error.message : String(error),
                    duration_ms: null,
                }),
        });
    }

    async function pickPath(kind: PathKind) {
        const selected = await open({ multiple: false, directory: kind === "directory" });
        if (typeof selected !== "string") return null;

        const home = await homeDir();
        const separator = sep();
        const homePrefix = home.endsWith(separator) ? home : `${home}${separator}`;
        return selected === home || selected.startsWith(homePrefix)
            ? `~${selected.slice(home.length)}`
            : selected;
    }

    useHotkey("J", () => moveSelection(1));
    useHotkey("K", () => moveSelection(-1));
    useHotkey("Space", toggleSelected);
    useHotkey("Enter", handleEnter);
    useHotkey("E", handleEnter);
    useHotkey("Escape", handleEscape);

    if (config.query.isPending) {
        return (
            <div className={styles.root}>
                <Typo.Small color="hint">Loading configuration…</Typo.Small>
            </div>
        );
    }

    if (config.query.isError || !data) {
        return (
            <div className={styles.root}>
                <Typo.Small color="hint">
                    Could not load configuration. Is the Livery backend running?
                </Typo.Small>
            </div>
        );
    }

    const contextValue: SettingsContextValue = {
        detecting,
        detections,
        detectError,
        onAutoDetect: autoDetectApps,
        linkableApps,
        provisioningByApp,
        editableFieldsByApp,
        verifyPathResults,
        onVerifyPath: verifyAdapterPath,
        linkThemesResults,
        onLinkThemes: linkAppThemes,
        setUpResults,
        onSetUp: setUpAdapterRow,
        testApplyResults,
        onTestApply: testApplyAdapter,
        onToggleEnabled: toggleAppEnabled,
        onFieldCommit: commitAdapterField,
        onAddConfigFolder: addConfigFolder,
        onRemoveConfigFolder: removeConfigFolder,
        configFoldersSaving,
        onPickPath: pickPath,
        onWriteNvimSettings: writeNvimSettings,
        writingNvimSettings: config.writeNvimSettings.isPending,
        nvimSettingsResult,
        onOpenUrl: (url) => {
            openUrl(url).catch((error) => console.error(error));
        },
        firstFieldRef,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            <App.SplitPanel
                left={
                    <SettingsSidebar
                        appEntries={appEntries}
                        detectedApps={detectedApps}
                        verifyPathResults={verifyPathResults}
                    />
                }
                right={<Outlet />}
            />
        </SettingsContext.Provider>
    );
}
