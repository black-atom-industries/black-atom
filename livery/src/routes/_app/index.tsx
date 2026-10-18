import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "@tanstack/react-store";
import { collectionOrder, themeCatalog } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import {
    ACTIVE_THEME_PERSISTENCE_APP,
    activeThemePersistenceError,
    commandErrorResult,
    getFailedUpdaters,
    mergeUpdateResults,
    summarizeApply,
    SYSTEM_APPEARANCE_APP,
    themeWasApplied,
} from "../../lib/progress.ts";
import { appStore } from "../../store/app.ts";
import { commands } from "../../bindings.ts";
import {
    applyTheme,
    createUpdaters,
    getEnabledApps,
    type UpdateResult,
} from "../../lib/updaters.ts";
import { getGroupedThemes } from "../../lib/themes.ts";
import { useConfig } from "../../queries/use-config.ts";
import { useActiveTheme } from "../../queries/use-active-theme.ts";
import { ThemeList } from "../../components/theme-list/index.ts";
import { ThemeDetail } from "../../components/theme-detail/index.ts";
import { App } from "../../components/layouts/app.ts";
import { Prompt } from "../../components/primitives/prompt/prompt.tsx";
import { Chip } from "../../components/primitives/chip/chip.tsx";
import { EmptyState } from "../../components/empty-state/index.ts";
import { ApplyRail } from "../../components/apply-rail/index.ts";
import { useDisplayedTheme } from "./-use-displayed-theme.ts";
import styles from "./index.module.css";

export const Route = createFileRoute("/_app/")({
    component: Component,
});

function Component() {
    const config = useConfig();
    const navigate = useNavigate();

    const allGroups = useMemo(() => getGroupedThemes(themeCatalog), []);
    const allThemes = useMemo(() => allGroups.flatMap((g) => g.themes), [allGroups]);

    const activeTheme = useActiveTheme();
    const phase = useStore(appStore, (s) => s.phase);
    const updaterResults = useStore(appStore, (s) => s.updaterResults);
    const applyingTheme = useStore(appStore, (s) => s.applyingTheme);
    const displayedTheme = useDisplayedTheme();

    const [query, setQuery] = useState("");
    // Filter sets — empty set = no filter (ALL).
    const [collectionFilter, setCollectionFilter] = useState<ReadonlySet<Theme.CollectionKey>>(
        new Set(),
    );
    const [appearanceFilter, setAppearanceFilter] = useState<ReadonlySet<"dark" | "light">>(
        new Set(),
    );

    function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
        const next = new Set(set);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    }

    const groups = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return allGroups
            .filter(
                (group) => collectionFilter.size === 0 || collectionFilter.has(group.collectionKey),
            )
            .map((group) => ({
                ...group,
                themes: group.themes.filter((theme) => {
                    const matchesQuery =
                        normalizedQuery === "" ||
                        theme.meta.name.toLowerCase().includes(normalizedQuery);
                    const matchesAppearance =
                        appearanceFilter.size === 0 || appearanceFilter.has(theme.meta.appearance);
                    return matchesQuery && matchesAppearance;
                }),
            }))
            .filter((group) => group.themes.length > 0);
    }, [allGroups, query, collectionFilter, appearanceFilter]);

    const themes = useMemo(() => groups.flatMap((g) => g.themes), [groups]);

    const [pickedIndex, setPickedIndex] = useState(0);
    const clampedIndex = Math.min(pickedIndex, Math.max(0, themes.length - 1));
    const pickedEntry = themes[clampedIndex];

    // The cursor opens on the active theme. The record arrives asynchronously,
    // so this lands once the query resolves and then never moves the cursor
    // again — a later refetch must not yank it out from under the user.
    const seededCursor = useRef(false);
    useEffect(() => {
        if (seededCursor.current) return;
        if (activeTheme.query.isPending) return;

        seededCursor.current = true;

        const key = activeTheme.theme?.meta.key;
        if (!key) return;
        const index = themes.findIndex((theme) => theme.meta.key === key);
        if (index >= 0) setPickedIndex(index);
    }, [activeTheme.query.isPending, activeTheme.theme, themes]);

    // Filter mode: a state-driven cursor over the chips (rendered via the
    // Chip `focused` prop) — deliberately not DOM focus, which WebKit's
    // focus-visible heuristics render unreliably.
    const filterChips = useMemo(
        () => [
            {
                label: "ALL",
                isActive: collectionFilter.size === 0,
                toggle: () => setCollectionFilter(new Set()),
            },
            ...collectionOrder.map((key) => ({
                label: key.toUpperCase(),
                isActive: collectionFilter.has(key),
                toggle: () => setCollectionFilter((set) => toggleInSet(set, key)),
            })),
            {
                label: "\u25d0 ALL",
                isActive: appearanceFilter.size === 0,
                toggle: () => setAppearanceFilter(new Set()),
            },
            {
                label: "\u25cf DARK",
                isActive: appearanceFilter.has("dark"),
                toggle: () => setAppearanceFilter((set) => toggleInSet(set, "dark")),
            },
            {
                label: "\u25cb LIGHT",
                isActive: appearanceFilter.has("light"),
                toggle: () => setAppearanceFilter((set) => toggleInSet(set, "light")),
            },
        ],
        [collectionFilter, appearanceFilter],
    );
    const collectionChips = filterChips.slice(0, collectionOrder.length + 1);
    const appearanceChips = filterChips.slice(collectionOrder.length + 1);

    const [filterCursor, setFilterCursor] = useState<number | null>(null);
    const inFilterMode = filterCursor !== null;

    /** 2D chip navigation: h/l move within a row, j/k jump between the
        collection row and the appearance row, keeping the column. */
    const moveFilterCursor = (dir: "up" | "down" | "left" | "right") =>
        setFilterCursor((c) => {
            if (c === null) return c;
            const rowSize = collectionChips.length;
            const total = filterChips.length;
            const row = c < rowSize ? 0 : 1;
            const col = row === 0 ? c : c - rowSize;

            switch (dir) {
                case "left":
                    return Math.max(row === 0 ? 0 : rowSize, c - 1);
                case "right":
                    return Math.min(row === 0 ? rowSize - 1 : total - 1, c + 1);
                case "down":
                    return row === 0 ? rowSize + Math.min(col, total - rowSize - 1) : c;
                case "up":
                    return row === 1 ? Math.min(col, rowSize - 1) : c;
            }
        });

    // While the Apply Rail is open (phase != picking) its vocabulary owns
    // j/k, ⏎ and esc — the picking vocabulary goes inert until dismissal.
    const railOpen = phase !== "picking";
    const summary = summarizeApply(updaterResults);

    // The rail is permanently docked. Idle (nothing applied yet) previews
    // the enabled adapters as pending rows — what an apply will touch.
    const railMode = railOpen
        ? ("active" as const)
        : updaterResults.length > 0
          ? ("settled" as const)
          : ("idle" as const);
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

    const moveUp = () => {
        if (railOpen) return;
        if (inFilterMode) moveFilterCursor("up");
        else setPickedIndex((i) => Math.max(0, i - 1));
    };
    const moveDown = () => {
        if (railOpen) return;
        if (inFilterMode) moveFilterCursor("down");
        else setPickedIndex((i) => Math.min(themes.length - 1, i + 1));
    };

    // Arrow keys
    useHotkey("ArrowUp", moveUp);
    useHotkey("ArrowDown", moveDown);
    useHotkey("ArrowLeft", () => !railOpen && inFilterMode && moveFilterCursor("left"));
    useHotkey("ArrowRight", () => !railOpen && inFilterMode && moveFilterCursor("right"));

    // Vim navigation
    useHotkey("K", () => (railOpen ? moveRailCursor(-1) : moveUp()));
    useHotkey("J", () => (railOpen ? moveRailCursor(1) : moveDown()));
    useHotkey("H", () => !railOpen && inFilterMode && moveFilterCursor("left"));
    useHotkey("L", () => !railOpen && inFilterMode && moveFilterCursor("right"));
    useHotkeySequence(["G", "G"], () => !railOpen && !inFilterMode && setPickedIndex(0));
    useHotkey("Shift+G", () => !railOpen && !inFilterMode && setPickedIndex(themes.length - 1));

    // Search, filters, settings, quit — the footer's advertised vocabulary
    const promptInputRef = useRef<HTMLInputElement>(null);

    useHotkey("/", (event) => {
        if (railOpen) return;
        event.preventDefault();
        setFilterCursor(null);
        promptInputRef.current?.focus();
    });
    useHotkey("F", () => !railOpen && setFilterCursor((c) => (c === null ? 0 : null)));
    useHotkey("Space", () => {
        if (railOpen) return;
        if (filterCursor !== null) filterChips[filterCursor]?.toggle();
    });
    useHotkey("S", () => navigate({ to: "/settings/adapters" }));
    // Muscle-memory alias: ⌘,/Ctrl+, — the OS-native settings chord.
    useHotkey("Mod+,", () => navigate({ to: "/settings/adapters" }));
    useHotkey("Q", () => {
        // Only meaningful inside the Tauri shell; a plain browser has no window handle.
        getCurrentWindow()
            .close()
            .catch(() => {});
    });
    useHotkey("Escape", () => {
        if (railOpen) {
            if (phase !== "applying") settleRail();
            return;
        }
        if (filterCursor !== null) setFilterCursor(null);
        else setQuery("");
    });

    const handleApplyTheme = async () => {
        if (phase === "applying") return;
        if (!config.query.data) return;
        if (!pickedEntry) return;

        const enabledApps = getEnabledApps(config.query.data.apps);
        const updaters = createUpdaters(enabledApps, pickedEntry.meta);

        if (updaters.length === 0 && !config.query.data.system_appearance) return;

        appStore.setState((s) => ({ ...s, applyingTheme: pickedEntry, phase: "applying" }));

        try {
            const results = await applyTheme(updaters, (partial) => {
                appStore.setState((s) => ({ ...s, updaterResults: partial }));
            });
            let applied = results.filter(themeWasApplied).length;

            if (config.query.data.system_appearance) {
                const result = await commands
                    .updateSystemAppearance(pickedEntry.meta.appearance)
                    .catch((error) => commandErrorResult(SYSTEM_APPEARANCE_APP, error));
                appStore.setState((s) => ({
                    ...s,
                    updaterResults: [...s.updaterResults, result],
                }));
                if (themeWasApplied(result)) applied += 1;
            }

            // One updater landing is enough to change what the user is looking
            // at, so the record follows the machine. A run that only skipped or
            // errored wrote nothing, and leaves the record standing.
            if (applied > 0) {
                try {
                    await activeTheme.set.mutateAsync(pickedEntry.meta.key);
                } catch (error) {
                    appStore.setState((s) => ({
                        ...s,
                        updaterResults: [
                            ...s.updaterResults.filter(
                                (result) => result.app !== ACTIVE_THEME_PERSISTENCE_APP,
                            ),
                            activeThemePersistenceError(error),
                        ],
                    }));
                }
            }
        } finally {
            appStore.setState((s) => ({ ...s, phase: "done" }));
        }
    };

    useHotkey("Enter", () => {
        if (railOpen) {
            toggleCursoredRow();
            return;
        }
        if (filterCursor !== null) {
            // Like the search bar: Enter hands key control back to the
            // list, cursor on the first match. Space toggles chips.
            setFilterCursor(null);
            setPickedIndex(0);
            return;
        }
        void handleApplyTheme();
    });

    const handleRetryFailed = async () => {
        if (!config.query.data) return;

        const failedApps = getFailedUpdaters(updaterResults);
        if (failedApps.length === 0) return;

        if (!applyingTheme) return;

        const persistenceFailed = failedApps.includes(ACTIVE_THEME_PERSISTENCE_APP);
        const appearanceFailed = failedApps.includes(SYSTEM_APPEARANCE_APP);
        const enabledApps = getEnabledApps(config.query.data.apps).filter(([name]) =>
            failedApps.includes(name),
        );
        if (!persistenceFailed && !appearanceFailed && enabledApps.length === 0) return;

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
            const results =
                enabledApps.length > 0
                    ? await applyTheme(retryUpdaters, (partial) => {
                          appStore.setState((s) => ({
                              ...s,
                              updaterResults: mergeUpdateResults(s.updaterResults, partial),
                          }));
                      })
                    : [];
            let applied = results.some(themeWasApplied);

            if (appearanceFailed) {
                const appearanceResult = await commands
                    .updateSystemAppearance(applyingTheme.meta.appearance)
                    .catch((error) => commandErrorResult(SYSTEM_APPEARANCE_APP, error));
                appStore.setState((s) => ({
                    ...s,
                    updaterResults: [
                        ...s.updaterResults.filter(
                            (result) => result.app !== SYSTEM_APPEARANCE_APP,
                        ),
                        appearanceResult,
                    ],
                }));
                applied ||= themeWasApplied(appearanceResult);
            }

            // A retry is where the record is most likely to be stale: it only
            // runs after a failed pass, which left the previous theme recorded.
            if (persistenceFailed || applied) {
                try {
                    await activeTheme.set.mutateAsync(applyingTheme.meta.key);
                    appStore.setState((s) => ({
                        ...s,
                        updaterResults: s.updaterResults.filter(
                            (result) => result.app !== ACTIVE_THEME_PERSISTENCE_APP,
                        ),
                    }));
                } catch (error) {
                    appStore.setState((s) => ({
                        ...s,
                        updaterResults: [
                            ...s.updaterResults.filter(
                                (result) => result.app !== ACTIVE_THEME_PERSISTENCE_APP,
                            ),
                            activeThemePersistenceError(error),
                        ],
                    }));
                }
            }
        } finally {
            appStore.setState((s) => ({ ...s, phase: "done" }));
        }
    };

    useHotkey("R", handleRetryFailed);

    const rail = (
        <aside className={styles.rail}>
            <ApplyRail
                mode={railMode}
                themeName={displayedTheme.meta.name.toUpperCase()}
                results={railResults}
                cursorApp={railMode === "active" ? (cursorResult?.app ?? null) : null}
                expandedApp={expandedApp}
                onToggleRow={toggleCursoredRow}
                onRetryFailed={handleRetryFailed}
            />
        </aside>
    );

    const configSettled = !config.query.isPending;
    const hasNoAdapters =
        configSettled && (config.query.isError || config.enabledApps.length === 0);

    if (hasNoAdapters) {
        return (
            <div className={styles.screen}>
                <div className={styles.picker}>
                    <EmptyState
                        eyebrow={`${allThemes.length} THEMES INDEXED · 0 APPLIED`}
                        headline="PICK A LIVERY, PAINT THE COCKPIT"
                        body="Select any theme with j/k and press ⏎ — Livery repaints every enabled tool in one pass. Nothing is written until you apply. No adapters are enabled yet — check settings."
                        onOpenSettings={() => navigate({ to: "/settings/adapters" })}
                    />
                </div>
                {rail}
            </div>
        );
    }

    return (
        <div className={styles.screen}>
            <div className={styles.picker}>
                <App.SplitPanel
                    rightFlush
                    left={
                        <>
                            <div
                                className={styles.prompt}
                                onKeyDown={(event) => {
                                    // Input filtering keeps global hotkeys out of the
                                    // input — Escape inside it is handled here.
                                    if (event.key === "Escape") {
                                        setQuery("");
                                        promptInputRef.current?.blur();
                                    }
                                }}
                            >
                                <Prompt
                                    value={query}
                                    inputRef={promptInputRef}
                                    onChange={(value) => {
                                        setQuery(value);
                                        setPickedIndex(0);
                                    }}
                                    onSubmit={() => {
                                        // Hand key control back to the list, cursor
                                        // on the first match.
                                        setPickedIndex(0);
                                        promptInputRef.current?.blur();
                                    }}
                                    count={`${themes.length}/${allThemes.length}`}
                                />
                            </div>
                            <div className={styles.chips}>
                                <div className={styles.chipGroup}>
                                    {collectionChips.map((chip, i) => (
                                        <Chip
                                            key={chip.label}
                                            active={chip.isActive}
                                            focused={filterCursor === i}
                                            onClick={chip.toggle}
                                        >
                                            {chip.label}
                                        </Chip>
                                    ))}
                                </div>
                                <div className={styles.chipGroup}>
                                    {appearanceChips.map((chip, i) => (
                                        <Chip
                                            key={chip.label}
                                            active={chip.isActive}
                                            focused={filterCursor === collectionChips.length + i}
                                            onClick={chip.toggle}
                                        >
                                            {chip.label}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.list}>
                                <ThemeList
                                    groups={groups}
                                    selectedIndex={clampedIndex}
                                    activeThemeKey={activeTheme.theme?.meta.key ?? null}
                                    onSelect={setPickedIndex}
                                />
                            </div>
                        </>
                    }
                    right={
                        <ThemeDetail
                            theme={pickedEntry}
                            isActive={pickedEntry?.meta.key === activeTheme.theme?.meta.key}
                        />
                    }
                />
            </div>
            {rail}
        </div>
    );
}
