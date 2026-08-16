import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "@tanstack/react-store";
import { collectionOrder, type ThemeCollectionKey, themeMap } from "@black-atom/core";
import { appStore } from "../../store/app.ts";
import { commands } from "../../bindings.ts";
import { applyTheme, createUpdaters, getEnabledApps } from "../../lib/updaters.ts";
import {
    type DownloadRowResult,
    downloadThemes,
    hasDownloadErrors,
    missingDownloadableApps,
} from "../../lib/theme-downloads.ts";
import { getGroupedThemes } from "../../lib/themes.ts";
import { useConfig } from "../../queries/use-config.ts";
import { useThemesStatus } from "../../queries/use-themes-status.ts";
import { ThemeList } from "../../components/theme-list/index.ts";
import { ThemeDetail } from "../../components/theme-detail/index.ts";
import { App } from "../../components/layouts/app.ts";
import { Prompt } from "../../components/primitives/prompt/prompt.tsx";
import { Chip } from "../../components/primitives/chip/chip.tsx";
import { EmptyState } from "../../components/empty-state/index.ts";
import { ThemeGreeting } from "../../components/theme-greeting/index.ts";
import styles from "./index.module.css";

export const Route = createFileRoute("/_app/")({
    component: Component,
});

function Component() {
    const config = useConfig();
    const themesStatus = useThemesStatus();
    const navigate = useNavigate();

    // Show the greeting when any downloadable adapter is missing its files.
    // This also catches adapters added after the initial download pass.
    const [downloadResults, setDownloadResults] = useState<DownloadRowResult[] | null>(null);
    const [downloading, setDownloading] = useState(false);
    const missingApps = themesStatus.query.data
        ? missingDownloadableApps(themesStatus.query.data.adapters)
        : [];
    const showGreeting = !themesStatus.query.isPending && (
        downloading || hasDownloadErrors(downloadResults) || missingApps.length > 0
    );

    const handleDownloadThemes = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            let adapters = themesStatus.query.data?.adapters;
            if (!adapters) adapters = (await themesStatus.query.refetch()).data?.adapters;
            if (!adapters) return;
            await downloadThemes(missingDownloadableApps(adapters), setDownloadResults);
        } finally {
            setDownloading(false);
            themesStatus.query.refetch();
        }
    };

    const handleContinueWithout = () => {
        setDownloadResults(null);
        themesStatus.dismiss.mutate();
    };

    const allGroups = useMemo(() => getGroupedThemes(themeMap), []);
    const allThemes = useMemo(() => allGroups.flatMap((g) => g.themes), [allGroups]);

    const currentTheme = useStore(appStore, (s) => s.currentTheme);
    const phase = useStore(appStore, (s) => s.phase);

    const [query, setQuery] = useState("");
    // Filter sets — empty set = no filter (ALL).
    const [collectionFilter, setCollectionFilter] = useState<ReadonlySet<ThemeCollectionKey>>(
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
            .filter((group) =>
                collectionFilter.size === 0 || collectionFilter.has(group.collectionKey)
            )
            .map((group) => ({
                ...group,
                themes: group.themes.filter((theme) => {
                    const matchesQuery = normalizedQuery === "" ||
                        theme.meta.name.toLowerCase().includes(normalizedQuery);
                    const matchesAppearance = appearanceFilter.size === 0 ||
                        appearanceFilter.has(theme.meta.appearance);
                    return matchesQuery && matchesAppearance;
                }),
            }))
            .filter((group) => group.themes.length > 0);
    }, [allGroups, query, collectionFilter, appearanceFilter]);

    const themes = useMemo(() => groups.flatMap((g) => g.themes), [groups]);

    const [pickedIndex, setPickedIndex] = useState(0);
    const clampedIndex = Math.min(pickedIndex, Math.max(0, themes.length - 1));
    const pickedEntry = themes[clampedIndex];

    // Filter mode: a state-driven cursor over the chips (rendered via the
    // Chip `focused` prop) — deliberately not DOM focus, which WebKit's
    // focus-visible heuristics render unreliably.
    const filterChips = useMemo(() => [
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
    ], [collectionFilter, appearanceFilter]);
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
    useHotkey("K", moveUp);
    useHotkey("J", moveDown);
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
        getCurrentWindow().close().catch(() => {});
    });
    useHotkey("Escape", () => {
        if (showGreeting) {
            if (!downloading) handleContinueWithout();
            return;
        }
        if (railOpen) return;
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

        appStore.setState((s) => ({ ...s, currentTheme: pickedEntry, phase: "applying" }));

        try {
            await applyTheme(updaters, (results) => {
                appStore.setState((s) => ({ ...s, updaterResults: results }));
            });

            if (config.query.data.system_appearance) {
                try {
                    await commands.updateSystemAppearance(pickedEntry.meta.appearance);
                } catch (error) {
                    console.warn("[system appearance]", error);
                }
            }
        } finally {
            appStore.setState((s) => ({ ...s, phase: "done" }));
        }
    };

    useHotkey("Enter", () => {
        if (showGreeting) {
            handleDownloadThemes();
            return;
        }
        if (railOpen) return;
        if (filterCursor !== null) {
            // Like the search bar: Enter hands key control back to the
            // list, cursor on the first match. Space toggles chips.
            setFilterCursor(null);
            setPickedIndex(0);
            return;
        }
        handleApplyTheme();
    });

    if (showGreeting) {
        return (
            <ThemeGreeting
                adapterCount={missingApps.length}
                results={downloadResults}
                downloading={downloading}
                onDownload={handleDownloadThemes}
                onContinueWithout={handleContinueWithout}
            />
        );
    }

    const configSettled = !config.query.isPending;
    const hasNoAdapters = configSettled &&
        (config.query.isError || config.enabledApps.length === 0);

    if (hasNoAdapters) {
        return (
            <EmptyState
                eyebrow={`${allThemes.length} THEMES INDEXED · 0 APPLIED`}
                headline="PICK A LIVERY, PAINT THE COCKPIT"
                body="Select any theme with j/k and press ⏎ — Livery repaints every enabled tool in one pass. Nothing is written until you apply. No adapters are enabled yet — check settings."
                onOpenSettings={() => navigate({ to: "/settings/adapters" })}
            />
        );
    }

    return (
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
                            onSelect={setPickedIndex}
                        />
                    </div>
                </>
            }
            right={
                <ThemeDetail
                    theme={pickedEntry}
                    isActive={pickedEntry?.meta.key === currentTheme.meta.key}
                />
            }
        />
    );
}
