import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "../../components/primitives/badge/badge.tsx";
import { Button } from "../../components/primitives/button/button.tsx";
import { Chip } from "../../components/primitives/chip/chip.tsx";
import { CodePreview } from "../../components/primitives/code-preview/code-preview.tsx";
import { CodeToken } from "../../components/primitives/code-preview/code-token.tsx";
import { KeyHint } from "../../components/primitives/key-hint/key-hint.tsx";
import { KVRow } from "../../components/primitives/kv-row/kv-row.tsx";
import { ListRow } from "../../components/primitives/list-row/list-row.tsx";
import { ProgressBar } from "../../components/primitives/progress-bar/progress-bar.tsx";
import { Prompt } from "../../components/primitives/prompt/prompt.tsx";
import { RadioGroup } from "../../components/primitives/radio-group/radio-group.tsx";
import { SectionHeader } from "../../components/primitives/section-header/section-header.tsx";
import { StatusPip } from "../../components/primitives/status-pip/status-pip.tsx";
import { Swatch } from "../../components/primitives/swatch/swatch.tsx";
import { TextInput } from "../../components/primitives/text-input/text-input.tsx";
import { Toggle } from "../../components/primitives/toggle/toggle.tsx";
import type { UpdateResult } from "../../lib/updaters.ts";

const KOYO_YORU_PALETTE = ["#C46A5A", "#D9A662", "#8FA36B", "#A97BA2"];
const KOYO_HIRU_PALETTE = ["#B0543F", "#7A8B4C", "#B08D3E", "#5F7A94"];

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

export const Route = createFileRoute("/dev/primitives")({
    component: Page,
});

function Page() {
    const [promptValue, setPromptValue] = useState("koyo");
    const [textInputValue, setTextInputValue] = useState("^theme = .*$");
    const [toggleOn, setToggleOn] = useState(true);
    const [radioValue, setRadioValue] = useState("keep");
    const [collectionValue, setCollectionValue] = useState("all");

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
                Primitives
            </h1>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Badge
                </h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <Badge>Dark</Badge>
                    <Badge>Light</Badge>
                    <Badge size="mini">D</Badge>
                    <Badge size="mini">L</Badge>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Button — bracket actuator
                </h2>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <Button intent="primary">Apply Theme</Button>
                    <Button>Configure</Button>
                    <Button intent="ghost">Dismiss</Button>
                    <Button hotkey="r">Retry Failed</Button>
                    <Button disabled>Unavailable</Button>
                    <Button intent="primary" disabled>Unavailable</Button>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    KeyHint — footer key vocabulary
                </h2>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                    <KeyHint keys="j/k">NAVIGATE</KeyHint>
                    <KeyHint keys="/">SEARCH</KeyHint>
                    <KeyHint keys="f">FILTERS</KeyHint>
                    <KeyHint keys="⏎">APPLY</KeyHint>
                    <KeyHint keys="esc">DISMISS</KeyHint>
                    <KeyHint keys="q">QUIT</KeyHint>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Swatch — the one sanctioned home of saturated color
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Swatch
                        variant="band"
                        color="#C46A5A"
                        label="ACCENT · BURGUNDY"
                    />
                    <Swatch
                        variant="band"
                        color="#8FA36B"
                        label="ACCENT · 01"
                        tag="DERIVED FROM PALETTE.RED"
                    />
                    <div style={{ display: "flex", gap: 2, maxWidth: 420 }}>
                        {KOYO_YORU_PALETTE.map((c) => <Swatch key={c} color={c} />)}
                    </div>
                    <Swatch variant="pips" colors={KOYO_YORU_PALETTE} />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    KVRow — datasheet key-value pair
                </h2>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        maxWidth: 280,
                    }}
                >
                    <KVRow label="COLLECTION">JPN</KVRow>
                    <KVRow label="STATUS" intent="positive">■ SYNCED · 8/8</KVRow>
                    <KVRow label="DRIFT" intent="warn">2 FILES</KVRow>
                    <KVRow label="LAST APPLY" intent="negative">FAILED</KVRow>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    StatusPip — the system's only status indicator
                </h2>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusPip intent="ok">SYNCED 8/8</StatusPip>
                    <StatusPip intent="running">delta ▶</StatusPip>
                    <StatusPip intent="pending">lazygit</StatusPip>
                    <StatusPip intent="warn">2 conflicts</StatusPip>
                    <StatusPip intent="error">obsidian</StatusPip>
                    <StatusPip intent="off">disabled</StatusPip>
                    <StatusPip intent="ok" />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    SectionHeader — primary structural pattern
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
                    <SectionHeader>PRIMARIES · 12</SectionHeader>
                    <SectionHeader meta="REV 03">SPEC</SectionHeader>
                    <SectionHeader>JPN — JAPAN (4)</SectionHeader>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    ListRow — keyboard-list row with palette pips
                </h2>
                <div style={{ display: "flex", flexDirection: "column", maxWidth: 420 }}>
                    <ListRow name="Koyo Hiru" pips={KOYO_HIRU_PALETTE} appearance="L" />
                    <ListRow selected name="Koyo Yoru" pips={KOYO_YORU_PALETTE} appearance="D" />
                    <ListRow name="Warm Precision" pips={KOYO_YORU_PALETTE} appearance="D" />
                    <ListRow dimmed name="Dark Dimmed" appearance="D" />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    ProgressBar — 3px determinate bar
                </h2>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        maxWidth: 420,
                    }}
                >
                    {(Object.keys(PROGRESS_FIXTURES) as (keyof typeof PROGRESS_FIXTURES)[]).map((
                        key,
                    ) => <ProgressBar key={key} results={PROGRESS_FIXTURES[key]} />)}
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    CodePreview — recessed code sample
                </h2>
                <div style={{ maxWidth: 420 }}>
                    <CodePreview>
                        <CodeToken color="#6B5D4C">{`// adapters/ghostty.ts`}</CodeToken> <br />
                        <CodeToken color="#C46A5A">const</CodeToken> path{" "}
                        <CodeToken color="#D9CBAE">=</CodeToken>{" "}
                        <CodeToken color="#7E93B0">expand</CodeToken>
                        <CodeToken color="#D9CBAE">(</CodeToken>
                        <CodeToken color="#8FA36B">"~/.config"</CodeToken>
                        <CodeToken color="#D9CBAE">);</CodeToken>
                    </CodePreview>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Prompt — block-cursor command/filter input
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
                    <Prompt placeholder="search theme names — /" />
                    <Prompt
                        value={promptValue}
                        onChange={setPromptValue}
                        count="2/24"
                        focused
                    />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    TextInput — datasheet text field
                </h2>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <TextInput
                            label="CONFIG_PATH"
                            value="~/.config/ghostty/config"
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <TextInput
                            label="THEMES_PATH"
                            optional
                            placeholder="optional — leave empty to skip"
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <TextInput
                            label="MATCH_PATTERN"
                            value={textInputValue}
                            onChange={setTextInputValue}
                            editing
                            hint="⏎ SAVE · esc REVERT"
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <TextInput
                            label="LOCKED_PATH"
                            value="/usr/local/etc/locked"
                            disabled
                        />
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Toggle — square-knob switch
                </h2>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <Toggle on={toggleOn} onChange={() => setToggleOn((v) => !v)} />
                    <Toggle on={false} />
                    <Toggle on disabled />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    RadioGroup — segmented single-choice control
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <RadioGroup
                        name="apply-mode"
                        options={[
                            { value: "keep", label: "KEEP + REPORT" },
                            { value: "rollback", label: "ROLL BACK" },
                        ]}
                        value={radioValue}
                        onChange={setRadioValue}
                    />
                    <RadioGroup
                        name="collection"
                        options={[
                            { value: "all", label: "ALL", hotkey: "1" },
                            { value: "jpn", label: "JPN", hotkey: "2" },
                            { value: "terra", label: "TERRA", hotkey: "3" },
                            { value: "mono", label: "MONO", hotkey: "4", disabled: true },
                        ]}
                        value={collectionValue}
                        onChange={setCollectionValue}
                    />
                </div>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2
                    style={{
                        fontFamily: "var(--ba-font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--ba-color-fg-subtle)",
                        marginBottom: 12,
                    }}
                >
                    Chip — filter chip
                </h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <Chip>JPN</Chip>
                    <Chip active>ALL</Chip>
                    <Chip hotkey="3">JPN</Chip>
                    <Chip active focused hotkey="4">TERRA</Chip>
                </div>
            </section>
        </div>
    );
}
