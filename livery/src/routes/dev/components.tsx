import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { themeMap } from "@black-atom/core";
import { AppHeader } from "../../components/app-header/index.ts";
import { AppFooter } from "../../components/app-footer/index.ts";
import { ApplyRail } from "../../components/apply-rail/index.ts";
import { EmptyState } from "../../components/empty-state/index.ts";
import { Button } from "../../components/primitives/button/button.tsx";
import { Chip } from "../../components/primitives/chip/chip.tsx";
import { DisclosurePanel } from "../../components/primitives/disclosure-panel/disclosure-panel.tsx";
import { Dialog } from "../../components/primitives/dialog/dialog.tsx";
import { KeyHint } from "../../components/primitives/key-hint/key-hint.tsx";
import { ProgressBar } from "../../components/primitives/progress-bar/progress-bar.tsx";
import { StatusPip } from "../../components/primitives/status-pip/status-pip.tsx";
import { ThemeList } from "../../components/theme-list/index.ts";
import { ThemeDetail } from "../../components/theme-detail/index.ts";
import { AdapterStatusRow } from "../../components/primitives/adapter-status-row/adapter-status-row.tsx";
import { ListRow } from "../../components/primitives/list-row/list-row.tsx";
import { adapterSettingsPages } from "../../components/settings/adapter-pages/index.ts";
import type {
    TestApplyResult,
    VerifyPathResult,
} from "../../components/settings/adapter-shared/index.ts";
import { getGroupedThemes } from "../../lib/themes.ts";
import type { UpdateResult } from "../../lib/updaters.ts";
import type { AdapterEditableField, AppConfig, AppName, Config } from "../../bindings.ts";

const SETTINGS_ADAPTERS_FIXTURE: Config = {
    system_appearance: false,
    apps: {
        nvim: { enabled: true, config_path: "~/.config/nvim/lua/theme.lua" },
        ghostty: {
            enabled: true,
            config_path: "~/.config/ghostty/config",
            themes_path: "~/.config/ghostty/themes",
            match_pattern: "^theme = .*$",
            replace_template: "theme = {theme_key}",
        },
        obsidian: {
            enabled: false,
            config_folders: ["~/notes/.obsidian", "~/work-notes/.obsidian-mobile"],
        },
        tmux: { enabled: true, config_path: "~/.tmux.conf" },
        zed: { enabled: true, config_path: "~/.config/zed/settings.json" },
        delta: { enabled: true, config_path: "~/.gitconfig" },
        lazygit: { enabled: true, config_path: "~/.config/lazygit/config.yml" },
        herdr: {
            enabled: true,
            config_path: "~/.config/herdr/config.toml",
            themes_path: "~/.local/share/black-atom/themes/herdr",
        },
        "helm-tmux": { enabled: true, config_path: "~/.config/black-atom/helm-tmux/config.yml" },
    },
};

const SETTINGS_EDITABLE_FIELDS: Record<AppName, AdapterEditableField[]> = {
    nvim: ["config_path", "match_pattern", "replace_template"],
    ghostty: ["config_path", "match_pattern", "replace_template"],
    "helm-tmux": ["config_path", "match_pattern", "replace_template"],
    delta: ["config_path", "match_pattern", "replace_template"],
    tmux: ["config_path", "themes_path", "match_pattern", "replace_template"],
    zed: ["config_path"],
    lazygit: ["config_path", "themes_path"],
    obsidian: [],
    herdr: ["config_path", "themes_path"],
};

const APPLY_RAIL_FIXTURES: Record<string, UpdateResult[]> = {
    idle: [
        { app: "nvim", status: "pending", duration_ms: null },
        { app: "tmux", status: "pending", duration_ms: null },
        { app: "ghostty", status: "pending", duration_ms: null },
        { app: "delta", status: "pending", duration_ms: null },
        { app: "lazygit", status: "pending", duration_ms: null },
        { app: "obsidian", status: "pending", duration_ms: null },
        { app: "helm-tmux", status: "pending", duration_ms: null },
    ],
    degraded: [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
        {
            app: "ghostty",
            status: "skipped",
            message: "config patched · live reload failed — restart ghostty",
            duration_ms: 15,
        },
        { app: "delta", status: "done", duration_ms: 60 },
        { app: "lazygit", status: "done", duration_ms: 92 },
        { app: "obsidian", status: "done", duration_ms: 110 },
        { app: "helm-tmux", status: "done", duration_ms: 115 },
    ],
    running: [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
        { app: "ghostty", status: "done", duration_ms: 15 },
        { app: "delta", status: "running", duration_ms: null },
        { app: "lazygit", status: "pending", duration_ms: null },
        { app: "obsidian", status: "pending", duration_ms: null },
        { app: "helm-tmux", status: "pending", duration_ms: null },
    ],
    success: [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
        { app: "ghostty", status: "done", duration_ms: 15 },
        { app: "delta", status: "done", duration_ms: 60 },
        { app: "lazygit", status: "done", duration_ms: 92 },
        { app: "obsidian", status: "done", duration_ms: 110 },
        { app: "helm-tmux", status: "done", duration_ms: 115 },
    ],
    partialFailure: [
        { app: "nvim", status: "done", duration_ms: 12 },
        { app: "tmux", status: "done", duration_ms: 8 },
        { app: "ghostty", status: "done", duration_ms: 15 },
        { app: "delta", status: "done", duration_ms: 60 },
        { app: "lazygit", status: "done", duration_ms: 92 },
        {
            app: "obsidian",
            status: "error",
            message:
                "Obsidian config folder not found at ~/work-notes/.obsidian-mobile — check configured config folders",
            duration_ms: 3,
        },
        { app: "helm-tmux", status: "done", duration_ms: 115 },
    ],
};

export const Route = createFileRoute("/dev/components")({
    component: Page,
});

const groups = getGroupedThemes(themeMap);
const themes = groups.flatMap((g) => g.themes);

const PROGRESS_FIXTURES: Record<string, UpdateResult[]> = {
    idle: [],
    running: [
        { app: "neovim", status: "running", message: null, duration_ms: null },
        { app: "alacritty", status: "pending", message: null, duration_ms: null },
        { app: "tmux", status: "pending", message: null, duration_ms: null },
    ],
    done: [
        { app: "neovim", status: "done", message: null, duration_ms: 42 },
        { app: "alacritty", status: "done", message: null, duration_ms: 18 },
        { app: "tmux", status: "done", message: null, duration_ms: 9 },
    ],
    error: [
        { app: "neovim", status: "done", message: null, duration_ms: 42 },
        { app: "alacritty", status: "error", message: "config file locked", duration_ms: 12 },
        { app: "tmux", status: "done", message: null, duration_ms: 9 },
    ],
};

function Page() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [progressState, setProgressState] = useState<keyof typeof PROGRESS_FIXTURES>("running");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [collectionValue, setCollectionValue] = useState("jpn");
    const [panelExpanded, setPanelExpanded] = useState(true);
    const [settingsFixture, setSettingsFixture] = useState(SETTINGS_ADAPTERS_FIXTURE);
    const [settingsSelectedApp, setSettingsSelectedApp] = useState<AppName>("ghostty");
    const [settingsTestApplyResults, setSettingsTestApplyResults] = useState<
        Partial<Record<AppName, TestApplyResult>>
    >({ ghostty: { status: "ok", durationMs: 412, testedThemeLabel: "Koyo Yoru" } });
    const [settingsVerifyPathResults, setSettingsVerifyPathResults] = useState<
        Partial<Record<AppName, VerifyPathResult>>
    >({
        obsidian: {
            status: "verified",
            exists: true,
            patternMatches: null,
            config_folders: [
                {
                    config_folder: "~/notes/.obsidian",
                    path: "/Users/nik/notes/.obsidian/appearance.json",
                    exists: true,
                },
                {
                    config_folder: "~/work-notes/.obsidian-mobile",
                    path: "/Users/nik/work-notes/.obsidian-mobile/appearance.json",
                    exists: true,
                },
            ],
        },
    });
    const [errorRowExpanded, setErrorRowExpanded] = useState(true);

    return (
        <div>
            <h1
                style={{
                    fontFamily: "var(--ba-font-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 24,
                }}
            >
                Components
            </h1>

            <SectionLabel>AppHeader</SectionLabel>
            <div
                style={{
                    border: "1px solid var(--ba-color-fg-hint)",
                    marginBottom: 32,
                    padding: "14px 20px",
                }}
            >
                <AppHeader version="0.3.0" context="24 THEMES · 6 COLLECTIONS · ENV DARK" />
            </div>

            <SectionLabel>AppFooter</SectionLabel>
            <div
                style={{
                    border: "1px solid var(--ba-color-fg-hint)",
                    marginBottom: 32,
                    padding: "10px 20px",
                }}
            >
                <AppFooter
                    hints={
                        <>
                            <KeyHint keys="j/k">NAVIGATE</KeyHint>
                            <KeyHint keys="/">SEARCH</KeyHint>
                            <KeyHint keys="⏎">APPLY</KeyHint>
                            <KeyHint keys="q">QUIT</KeyHint>
                        </>
                    }
                    status={<StatusPip intent="ok">READY</StatusPip>}
                />
            </div>

            <SectionLabel>Dialog</SectionLabel>
            <div style={{ marginBottom: 32 }}>
                <Button onClick={() => setDialogOpen(true)}>OPEN FILTERS</Button>
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    title="FILTERS"
                    footerLeft="12 THEMES MATCH"
                    footerRight={
                        <>
                            <KeyHint keys="h/l ←→">MOVE</KeyHint> <KeyHint keys="⏎">DONE</KeyHint>
                        </>
                    }
                >
                    <Chip
                        active={collectionValue === "all"}
                        hotkey="1"
                        onClick={() => setCollectionValue("all")}
                    >
                        ALL
                    </Chip>{" "}
                    <Chip
                        active={collectionValue === "jpn"}
                        hotkey="3"
                        onClick={() => setCollectionValue("jpn")}
                    >
                        JPN
                    </Chip>{" "}
                    <Chip
                        active={collectionValue === "terra"}
                        hotkey="4"
                        onClick={() => setCollectionValue("terra")}
                    >
                        TERRA
                    </Chip>
                </Dialog>
            </div>

            <SectionLabel>DisclosurePanel</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                <DisclosurePanel
                    expanded={panelExpanded}
                    onToggle={() => setPanelExpanded((v) => !v)}
                    header={
                        <>
                            <b style={{ width: 110 }}>ghostty</b>
                            <span>~/.config/ghostty/config</span>
                            <StatusPip intent="ok">OK</StatusPip>
                        </>
                    }
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 14,
                            padding: 16,
                        }}
                    >
                        <div>CONFIG_PATH: ~/.config/ghostty/config</div>
                        <div>MATCH_PATTERN: ^theme = .*$</div>
                    </div>
                </DisclosurePanel>
                <DisclosurePanel
                    expanded={false}
                    header={
                        <>
                            <b style={{ width: 110 }}>nvim</b>
                            <span>~/.config/nvim/…</span>
                            <StatusPip intent="ok">OK</StatusPip>
                        </>
                    }
                />
            </div>

            <SectionLabel>Settings — adapters panel (master-detail)</SectionLabel>
            <div
                style={{
                    border: "1px solid var(--ba-color-fg-hint)",
                    marginBottom: 32,
                    display: "flex",
                    maxWidth: 900,
                }}
            >
                <div style={{ width: 220, borderRight: "1px solid var(--ba-color-fg-hint)" }}>
                    {(Object.entries(settingsFixture.apps) as [AppName, AppConfig][]).map((
                        [appName],
                    ) => (
                        <ListRow
                            key={appName}
                            name={appName}
                            indented
                            selected={settingsSelectedApp === appName}
                            onClick={() => setSettingsSelectedApp(appName)}
                        />
                    ))}
                </div>
                <div style={{ flex: 1, padding: "24px 28px" }}>
                    {(() => {
                        const AdapterSettings = adapterSettingsPages[settingsSelectedApp];
                        return (
                            <AdapterSettings
                                appConfig={settingsFixture.apps[settingsSelectedApp]}
                                editableFields={new Set(
                                    SETTINGS_EDITABLE_FIELDS[settingsSelectedApp],
                                )}
                                detected={["ghostty", "tmux"].includes(settingsSelectedApp)}
                                onToggleEnabled={() => {
                                    setSettingsFixture((prev) => ({
                                        ...prev,
                                        apps: {
                                            ...prev.apps,
                                            [settingsSelectedApp]: {
                                                ...prev.apps[settingsSelectedApp],
                                                enabled: prev.apps[settingsSelectedApp].enabled ===
                                                    false,
                                            },
                                        },
                                    }));
                                }}
                                onFieldCommit={(field, value) => {
                                    setSettingsFixture((prev) => ({
                                        ...prev,
                                        apps: {
                                            ...prev.apps,
                                            [settingsSelectedApp]: {
                                                ...prev.apps[settingsSelectedApp],
                                                [field]: value,
                                            },
                                        },
                                    }));
                                }}
                                onPickPath={() => Promise.resolve(null)}
                                onAddConfigFolder={() => {
                                    if (settingsSelectedApp !== "obsidian") return;
                                    setSettingsFixture((prev) => ({
                                        ...prev,
                                        apps: {
                                            ...prev.apps,
                                            obsidian: {
                                                ...prev.apps.obsidian,
                                                config_folders: [
                                                    ...(prev.apps.obsidian.config_folders ?? []),
                                                    "~/new-notes/.obsidian",
                                                ],
                                            },
                                        },
                                    }));
                                }}
                                onRemoveConfigFolder={(config_folder) => {
                                    if (settingsSelectedApp !== "obsidian") return;
                                    setSettingsFixture((prev) => ({
                                        ...prev,
                                        apps: {
                                            ...prev.apps,
                                            obsidian: {
                                                ...prev.apps.obsidian,
                                                config_folders:
                                                    (prev.apps.obsidian.config_folders ?? [])
                                                        .filter((folder) =>
                                                            folder !== config_folder
                                                        ),
                                            },
                                        },
                                    }));
                                }}
                                configFoldersSaving={false}
                                linkable={["zed", "ghostty", "tmux", "obsidian"].includes(
                                    settingsSelectedApp,
                                )}
                                onLinkThemes={() => {}}
                                onSetUp={() => {}}
                                setUpResult={undefined}
                                onTestApply={() => {
                                    const appName = settingsSelectedApp;
                                    setSettingsTestApplyResults((prev) => ({
                                        ...prev,
                                        [appName]: { status: "running" },
                                    }));
                                    setTimeout(() => {
                                        setSettingsTestApplyResults((prev) => ({
                                            ...prev,
                                            [appName]: appName === "obsidian"
                                                ? { status: "error", message: "config not found" }
                                                : {
                                                    status: "ok",
                                                    durationMs: 380 +
                                                        Math.round(Math.random() * 80),
                                                    testedThemeLabel: "Fall Night",
                                                },
                                        }));
                                    }, 600);
                                }}
                                testApplyResult={settingsTestApplyResults[settingsSelectedApp]}
                                onVerifyPath={() => {
                                    const appName = settingsSelectedApp;
                                    setSettingsVerifyPathResults((prev) => ({
                                        ...prev,
                                        [appName]: { status: "running" },
                                    }));
                                    setTimeout(() => {
                                        setSettingsVerifyPathResults((prev) => ({
                                            ...prev,
                                            [appName]: appName === "obsidian"
                                                ? {
                                                    status: "verified",
                                                    exists: true,
                                                    patternMatches: null,
                                                    config_folders: [
                                                        {
                                                            config_folder: "~/notes/.obsidian",
                                                            path:
                                                                "/Users/nik/notes/.obsidian/appearance.json",
                                                            exists: true,
                                                        },
                                                        {
                                                            config_folder:
                                                                "~/work-notes/.obsidian-mobile",
                                                            path:
                                                                "/Users/nik/work-notes/.obsidian-mobile/appearance.json",
                                                            exists: true,
                                                        },
                                                    ],
                                                }
                                                : {
                                                    status: "verified",
                                                    exists: true,
                                                    patternMatches: appName === "ghostty"
                                                        ? true
                                                        : null,
                                                },
                                        }));
                                    }, 400);
                                }}
                                verifyPathResult={settingsVerifyPathResults[settingsSelectedApp]}
                            />
                        );
                    })()}
                </div>
            </div>

            <SectionLabel>ProgressBar</SectionLabel>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {(Object.keys(PROGRESS_FIXTURES) as (keyof typeof PROGRESS_FIXTURES)[]).map((
                    key,
                ) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setProgressState(key)}
                        style={{
                            fontFamily: "var(--ba-font-mono)",
                            fontSize: 11,
                            textTransform: "uppercase",
                            padding: "4px 10px",
                            border: "1px solid var(--ba-color-fg-hint)",
                            background: progressState === key
                                ? "var(--ba-color-bg-hint)"
                                : "transparent",
                            color: progressState === key
                                ? "var(--ba-color-fg-positive)"
                                : "var(--ba-color-fg-subtle)",
                            cursor: "pointer",
                        }}
                    >
                        {key}
                    </button>
                ))}
            </div>
            <div style={{ marginBottom: 32 }}>
                <ProgressBar results={PROGRESS_FIXTURES[progressState]} />
            </div>

            <SectionLabel>
                AdapterStatusRow — five statuses · cursored · degraded · expanded error
            </SectionLabel>
            <div
                style={{
                    width: 280,
                    border: "1px solid var(--ba-color-fg-hint)",
                    marginBottom: 32,
                    padding: "8px 0",
                }}
            >
                <AdapterStatusRow name="system" status="ok" durationMs={8} />
                <AdapterStatusRow name="nvim" status="ok" durationMs={92} />
                <AdapterStatusRow name="delta" status="running" cursored />
                <AdapterStatusRow name="lazygit" status="pending" />
                <AdapterStatusRow
                    name="ghostty"
                    status="warn"
                    message="config patched · live reload failed — restart ghostty"
                />
                <AdapterStatusRow
                    name="obsidian"
                    status="error"
                    cursored
                    expanded={errorRowExpanded}
                    message="ENOENT: Obsidian config folder not found. Check the configured config folders."
                    path="~/notes/.obsidian/appearance.json"
                    code="LVR-102"
                    onToggle={() => setErrorRowExpanded((e) => !e)}
                    onRetry={() => {}}
                />
            </div>

            <SectionLabel>
                ApplyRail — idle · running · success · partial failure · degraded
            </SectionLabel>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 32 }}>
                <div style={{ height: 400, border: "1px solid var(--ba-color-fg-hint)" }}>
                    <ApplyRail
                        mode="idle"
                        themeName="KOYO YORU"
                        results={APPLY_RAIL_FIXTURES.idle}
                    />
                </div>
                <div style={{ height: 400, border: "1px solid var(--ba-color-fg-hint)" }}>
                    <ApplyRail
                        mode="active"
                        themeName="KOYO YORU"
                        results={APPLY_RAIL_FIXTURES.running}
                        cursorApp="delta"
                    />
                </div>
                <div style={{ height: 400, border: "1px solid var(--ba-color-fg-hint)" }}>
                    <ApplyRail
                        mode="active"
                        themeName="KOYO YORU"
                        results={APPLY_RAIL_FIXTURES.success}
                    />
                </div>
                <div style={{ height: 400, border: "1px solid var(--ba-color-fg-hint)" }}>
                    <ApplyRail
                        mode="active"
                        themeName="KOYO YORU"
                        results={APPLY_RAIL_FIXTURES.partialFailure}
                        cursorApp="obsidian"
                        expandedApp="obsidian"
                        onToggleRow={() => {}}
                        onRetryFailed={() => {}}
                    />
                </div>
                <div style={{ height: 400, border: "1px solid var(--ba-color-fg-hint)" }}>
                    <ApplyRail
                        mode="active"
                        themeName="KOYO YORU"
                        results={APPLY_RAIL_FIXTURES.degraded}
                        cursorApp="ghostty"
                    />
                </div>
            </div>

            <SectionLabel>EmptyState — first run, no adapters</SectionLabel>
            <div
                style={{
                    border: "1px solid var(--ba-color-fg-hint)",
                    marginBottom: 32,
                    padding: 28,
                }}
            >
                <EmptyState
                    eyebrow={`${themes.length} THEMES INDEXED · 0 APPLIED`}
                    headline="PICK A LIVERY, PAINT THE COCKPIT"
                    body="Select any theme with j/k and press ⏎ — Livery repaints every enabled tool in one pass. Nothing is written until you apply. No adapters are enabled yet — check settings."
                    onOpenSettings={() => {}}
                />
            </div>

            <SectionLabel>ThemeList + ThemeDetail</SectionLabel>
            <div
                style={{
                    display: "flex",
                    border: "1px solid var(--ba-color-fg-hint)",
                    height: 320,
                    marginBottom: 32,
                }}
            >
                <div
                    style={{
                        width: "50%",
                        overflow: "auto",
                        borderRight: "1px solid var(--ba-color-fg-hint)",
                    }}
                >
                    <ThemeList
                        groups={groups}
                        selectedIndex={selectedIndex}
                        onSelect={setSelectedIndex}
                    />
                </div>
                <div style={{ width: "50%", overflow: "auto", padding: 16 }}>
                    <ThemeDetail theme={themes[selectedIndex]} />
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontFamily: "var(--ba-font-mono)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ba-color-fg-subtle)",
                marginBottom: 12,
            }}
        >
            {children}
        </div>
    );
}
