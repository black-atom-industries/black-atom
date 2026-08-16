import type { ThemeDefinition } from "@black-atom/core";
import { formatCollectionTitle } from "../../lib/themes.ts";
import { themeToCustomProperties } from "../../lib/tokens.ts";
import { Badge } from "../primitives/badge/badge.tsx";
import { CodePreview } from "../primitives/code-preview/code-preview.tsx";
import { CodeToken } from "../primitives/code-preview/code-token.tsx";
import { KVRow } from "../primitives/kv-row/kv-row.tsx";
import { SectionHeader } from "../primitives/section-header/section-header.tsx";
import { StatusPip } from "../primitives/status-pip/status-pip.tsx";
import { Swatch } from "../primitives/swatch/swatch.tsx";
import { Typo } from "../typo/index.ts";
import styles from "./theme-detail.module.css";

const STATUS_INTENT = {
    release: "positive",
    beta: "warn",
    development: "negative",
} as const satisfies Record<ThemeDefinition["meta"]["status"], "positive" | "warn" | "negative">;

interface ThemeDetailProps {
    theme: ThemeDefinition | undefined;
    /** Whether this theme is the one currently applied to the system. */
    isActive?: boolean;
}

const PRIMARY_KEYS = [
    "d10",
    "d20",
    "d30",
    "d40",
    "m10",
    "m20",
    "m30",
    "m40",
    "l10",
    "l20",
    "l30",
    "l40",
] as const;

/** ANSI order per the board's PALETTE section: normal row, then dark row. */
const PALETTE_KEYS = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "gray",
    "darkRed",
    "darkGreen",
    "darkYellow",
    "darkBlue",
    "darkMagenta",
    "darkCyan",
    "lightGray",
] as const;

export function ThemeDetail({ theme, isActive }: ThemeDetailProps) {
    if (!theme) {
        return <div className={styles.empty}>No theme selected</div>;
    }

    const { meta, palette, primaries, syntax } = theme;
    const appearanceLabel = meta.appearance.toUpperCase();
    const appearanceLetter = meta.appearance === "dark" ? "D" : "L";
    const docCode = `DOC LVR-${meta.collection.key.toUpperCase()}-${
        initials(meta.name)
    }-${appearanceLetter} · REV 01`;

    const accents = getAccentBands(theme);
    const feedback = getFeedbackBands(theme);

    return (
        <div
            data-component="theme-detail"
            className={styles.root}
            /* Scope-override the chrome tokens with the previewed theme's ui
               palette — the pane renders IN the cursored theme (bg.default
               page, bg.panel panels, derived borders) while the app chrome
               keeps the applied theme. Theme values are content here. */
            style={themeToCustomProperties(theme) as React.CSSProperties}
        >
            <div className={styles.headerRow}>
                <div className={styles.titleColumn}>
                    <div className={styles.titleGroup}>
                        <Typo.H1 className={styles.name}>{meta.name.toUpperCase()}</Typo.H1>
                        <Badge>{appearanceLabel}</Badge>
                    </div>
                    <div className={styles.collectionLine}>
                        {formatCollectionTitle(meta.collection.key, meta.collection.label)}{" "}
                        COLLECTION · KEY {meta.key}
                    </div>
                </div>
                {isActive
                    ? <StatusPip intent="ok">ACTIVE</StatusPip>
                    : <StatusPip intent="off">INACTIVE</StatusPip>}
            </div>

            <div className={styles.section}>
                <SectionHeader>PRIMARIES · {PRIMARY_KEYS.length}</SectionHeader>
                <div className={styles.primariesGrid}>
                    {PRIMARY_KEYS.map((key) => (
                        <Swatch key={key} variant="cell" color={primaries[key]} />
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <SectionHeader>PALETTE · ANSI 16</SectionHeader>
                <div className={styles.paletteGrid}>
                    {PALETTE_KEYS.map((key) => (
                        <Swatch key={key} variant="cell" color={palette[key]} />
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <SectionHeader>ACCENTS · {accents.length}</SectionHeader>
                <div className={styles.bands}>
                    {accents.map((accent) => (
                        <Swatch
                            key={accent.label}
                            variant="band"
                            color={accent.color}
                            label={accent.label}
                            tag={accent.tag}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <SectionHeader>SEMANTIC · FEEDBACK</SectionHeader>
                <div className={styles.bands}>
                    {feedback.map((entry) => (
                        <Swatch
                            key={entry.label}
                            variant="band"
                            color={entry.color}
                            label={entry.label}
                            tag={entry.tag}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.bottomGrid}>
                <div className={styles.section}>
                    <SectionHeader>PREVIEW · RENDERED IN THEME</SectionHeader>
                    <CodePreview>
                        <div>
                            <CodeToken color={syntax.comment.default}>
                                // adapters/ghostty.ts
                            </CodeToken>
                        </div>
                        <div>
                            <CodeToken color={syntax.keyword.default}>export function</CodeToken>
                            {" "}
                            <CodeToken color={syntax.func.default}>apply</CodeToken>(theme:{" "}
                            <CodeToken color={syntax.type.default}>Theme</CodeToken>) {"{"}
                        </div>
                        <div>
                            &nbsp;&nbsp;<CodeToken color={syntax.keyword.default}>const</CodeToken>
                            {" "}
                            path = <CodeToken color={syntax.func.default}>expand</CodeToken>(
                            <CodeToken color={syntax.string.default}>
                                "~/.config/ghostty"
                            </CodeToken>
                            );
                        </div>
                        <div>
                            &nbsp;&nbsp;<CodeToken color={syntax.keyword.default}>return</CodeToken>
                            {" "}
                            <CodeToken color={syntax.func.default}>write</CodeToken>(path,{" "}
                            <CodeToken color={syntax.func.default}>render</CodeToken>(theme));
                        </div>
                        <div>{"}"}</div>
                    </CodePreview>
                </div>

                <div className={styles.spec}>
                    <SectionHeader>SPEC</SectionHeader>
                    <div className={styles.kvRows}>
                        <KVRow label="COLLECTION">{meta.collection.key.toUpperCase()}</KVRow>
                        <KVRow label="APPEARANCE">{appearanceLabel}</KVRow>
                        <KVRow label="STATUS" intent={STATUS_INTENT[meta.status]}>
                            ■ {meta.status.toUpperCase()}
                        </KVRow>
                    </div>
                    <div className={styles.docCode}>{docCode}</div>
                </div>
            </div>
        </div>
    );
}

type ColorBand = { label: string; color: string; tag?: string };

/**
 * The theme's own accent colors. Published core 0.4.x predates
 * `ThemeDefinition.accents`, so bundles built against it fall back to the
 * board's ANSI derivation (tagged as such) — never hide the section,
 * never show it empty.
 */
function getAccentBands(theme: ThemeDefinition): ColorBand[] {
    const accents = (theme as Partial<ThemeDefinition>).accents;

    if (accents) {
        const entries = [accents.a10, accents.a20, accents.a30, accents.a40];

        return entries.flatMap((color, i) =>
            color ? [{ label: `ACCENT · ${String(i + 1).padStart(2, "0")}`, color }] : []
        );
    }

    return (["red", "yellow", "green", "magenta"] as const).map((key) => ({
        label: `ACCENT · ${key.toUpperCase()}`,
        color: theme.palette[key],
        tag: `DERIVED FROM PALETTE.${key.toUpperCase()}`,
    }));
}

/**
 * The theme's semantic feedback colors, with the same 0.4.x fallback —
 * the `ui.fg` intents carry the equivalent values.
 */
function getFeedbackBands(theme: ThemeDefinition): ColorBand[] {
    const feedback = (theme as Partial<ThemeDefinition>).feedback;

    if (feedback) {
        return [
            { label: "SUCCESS", color: feedback.success },
            { label: "WARNING", color: feedback.warning },
            { label: "NEGATIVE", color: feedback.negative },
            { label: "INFO", color: feedback.info },
        ];
    }

    return [
        { label: "SUCCESS", color: theme.ui.fg.positive, tag: "FROM UI.FG.POSITIVE" },
        { label: "WARNING", color: theme.ui.fg.warn, tag: "FROM UI.FG.WARN" },
        { label: "NEGATIVE", color: theme.ui.fg.negative, tag: "FROM UI.FG.NEGATIVE" },
        { label: "INFO", color: theme.ui.fg.info, tag: "FROM UI.FG.INFO" },
    ];
}

/** Two-letter initials from a theme name, e.g. "Koyo Yoru" -> "KY". */
function initials(name: string): string {
    const letters = name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");

    return (letters || name.slice(0, 2).toUpperCase()).slice(0, 2);
}
