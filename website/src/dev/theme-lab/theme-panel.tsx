import type { CSSProperties } from "react";
import type * as Theme from "@black-atom/core";
import { analyzeThemeContrast, type ContrastPair } from "@black-atom/core/contrast";
import {
    code,
    cursorLine,
    diagnostics,
    diff,
    diffStart,
    gitSigns,
    hunk,
    searchWord,
    selectedLine,
    terminalSlots,
    tokenize,
    uiPairs,
    type Token,
} from "./mock.ts";
import styles from "./theme-lab.module.css";

const lowRatio = 3;

/** Contrast pairs of a theme, keyed `fg|bg` as in the analysis. */
export function contrastPairs(theme: Theme.Definition): Map<string, ContrastPair> {
    const pairs = analyzeThemeContrast(theme).categories.flatMap((category) => category.pairs);
    return new Map(pairs.map((pair) => [`${pair.fg.key}|${pair.bg.key}`, pair]));
}

function mix(color: string, base: string, share: number) {
    return `color-mix(in srgb, ${color} ${share * 100}%, ${base})`;
}

function Tokens({ tokens, theme }: { tokens: Token[]; theme: Theme.Definition }) {
    return tokens.map(([text, group], index) => (
        <span
            key={index}
            style={{
                color: group ? theme.syntax[group].default : theme.ui.fg.default,
                background: text === searchWord ? theme.ui.bg.search : undefined,
            }}
        >
            {text}
        </span>
    ));
}

function Sidebar({ ui }: Theme.Definition) {
    const rows: [string, string, string][] = [
        ["▾ src", ui.fg.subtle, "transparent"],
        ["  load.ts", ui.fg.default, ui.bg.active],
        ["  parse.ts", ui.fg.default, ui.bg.hover],
        ["  theme.ts  M", ui.fg.modify, "transparent"],
        ["  new.ts    A", ui.fg.add, "transparent"],
        ["  old.ts    D", ui.fg.delete, "transparent"],
        ["  dist/", ui.fg.disabled, "transparent"],
    ];
    return (
        <div className={styles.sidebar} style={{ background: ui.bg.panel }}>
            {rows.map(([text, color, background]) => (
                <div key={text} className={styles.line} style={{ color, background }}>
                    {text}
                </div>
            ))}
        </div>
    );
}

function Code({ theme }: { theme: Theme.Definition }) {
    const { ui } = theme;
    return code.map((text, index) => {
        const sign = gitSigns[index];
        const diagnostic = diagnostics[index];
        const background =
            index === cursorLine
                ? ui.bg.active
                : index === selectedLine
                  ? ui.bg.selection
                  : undefined;
        return (
            <div key={index} className={styles.line} style={{ background }}>
                <span style={{ color: sign ? ui.fg[sign] : undefined }}>{sign ? "▎" : " "}</span>
                <span style={{ color: index === cursorLine ? ui.fg.default : ui.fg.disabled }}>
                    {String(index + 1).padStart(2)}
                </span>
                {"  "}
                <Tokens tokens={tokenize(text)} theme={theme} />
                {diagnostic && (
                    <>
                        {"  "}
                        <span
                            style={{
                                color: ui.fg[diagnostic[0]],
                                background: ui.bg[diagnostic[0]],
                            }}
                        >
                            ● {diagnostic[1]}
                        </span>
                    </>
                )}
            </div>
        );
    });
}

function Float({ theme }: { theme: Theme.Definition }) {
    const { ui } = theme;
    return (
        <div
            className={styles.float}
            style={{ background: ui.bg.float, borderColor: ui.fg.disabled }}
        >
            <span style={{ color: theme.syntax.func.default }}>load</span>
            <span style={{ color: ui.fg.default }}>(file: string)</span>
            <div style={{ color: ui.fg.subtle }}>Reads and parses a theme file.</div>
        </div>
    );
}

function Diff({ theme }: { theme: Theme.Definition }) {
    const { ui } = theme;
    const signs = { context: " ", add: "+", delete: "-", modify: "~" };
    let number = diffStart - 1;
    return (
        <>
            <div className={styles.line} style={{ background: ui.bg.panel, color: ui.fg.subtle }}>
                {hunk}
            </div>
            {diff.map(([kind, text], index) => {
                if (kind !== "delete") number++;
                const gutter = `${kind === "delete" ? "  " : String(number).padStart(2)} ${signs[kind]} `;
                const tokens = <Tokens tokens={tokenize(text)} theme={theme} />;
                if (kind === "context") {
                    return (
                        <div key={index} className={styles.line}>
                            <span style={{ color: ui.fg.disabled }}>{gutter}</span>
                            {tokens}
                        </div>
                    );
                }
                return (
                    <div
                        key={index}
                        className={styles.diffLine}
                        style={{ background: mix(ui.bg[kind], ui.bg.default, 0.6) }}
                    >
                        <span
                            className={styles.gutter}
                            style={{
                                color: ui.fg.default,
                                background: mix(ui.fg[kind], ui.bg[kind], 0.12),
                            }}
                        >
                            {gutter}
                        </span>
                        {tokens}
                    </div>
                );
            })}
        </>
    );
}

function Statusline({ ui }: Theme.Definition) {
    return (
        <div className={styles.status} style={{ background: ui.bg.panel, color: ui.fg.subtle }}>
            <span style={{ color: ui.fg.contrast, background: ui.bg.contrast }}> NORMAL </span>{" "}
            <span style={{ color: ui.fg.accent }}>main</span> load.ts{" "}
            <span style={{ color: ui.fg.negative }}>✘ 1</span>{" "}
            <span style={{ color: ui.fg.warn }}>▲ 1</span>{" "}
            <span style={{ color: ui.fg.info }}>● 1</span>{" "}
            <span style={{ color: ui.fg.positive }}>✔ saved</span>
        </div>
    );
}

function Terminal({ ui, palette }: Theme.Definition) {
    return (
        <div className={styles.terminal}>
            <span style={{ color: ui.fg.accent }}>❯</span>{" "}
            {terminalSlots.map((slot) => (
                <span key={slot} style={{ color: palette[slot] }}>
                    {slot}{" "}
                </span>
            ))}
            <span style={{ background: ui.fg.accent }}> </span>
        </div>
    );
}

function RatioColumn({
    title,
    keys,
    pairs,
    label,
}: {
    title: string;
    keys: string[];
    pairs: Map<string, ContrastPair>;
    label: (pair: ContrastPair) => string;
}) {
    return (
        <div>
            <div className={styles.title}>{title}</div>
            {keys.flatMap((key) => {
                const pair = pairs.get(key);
                if (!pair) return [];
                return (
                    <div key={key} className={styles.token}>
                        <span
                            className={styles.sample}
                            style={{ color: pair.fg.color, background: pair.bg.color }}
                        >
                            Aa
                        </span>
                        <span>{label(pair)}</span>
                        <span className={pair.ratio < lowRatio ? styles.low : styles.ratio}>
                            {pair.ratio.toFixed(1)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function Ratios({ theme }: { theme: Theme.Definition }) {
    const pairs = contrastPairs(theme);
    const syntaxGroups = [
        ...new Set(
            [...code, ...diff.map(([, text]) => text)].flatMap((text) =>
                tokenize(text).flatMap(([, group]) => group ?? []),
            ),
        ),
    ];
    return (
        <div className={styles.ratios}>
            <RatioColumn
                title="UI"
                keys={uiPairs}
                pairs={pairs}
                label={(pair) =>
                    pair.bg.key === "bg.default"
                        ? pair.fg.key.slice(3)
                        : `${pair.fg.key.slice(3)} on ${pair.bg.key.slice(3)}`
                }
            />
            <RatioColumn
                title="Syntax"
                keys={syntaxGroups.map((group) => `syntax.${group}.default|bg.default`)}
                pairs={pairs}
                label={(pair) => pair.fg.key.split(".")[1] ?? pair.fg.key}
            />
            <RatioColumn
                title="Terminal"
                keys={terminalSlots.map((slot) => `palette.${slot}|bg.default`)}
                pairs={pairs}
                label={(pair) => pair.fg.key.slice("palette.".length)}
            />
        </div>
    );
}

/** One theme rendered as a mock editor with its contrast ratios. */
export function ThemePanel({ theme, label }: { theme: Theme.Definition; label: string }) {
    const { ui } = theme;
    const style: CSSProperties = { background: ui.bg.default, color: ui.fg.default };
    return (
        <div className={styles.panel} style={style}>
            <div className={styles.label}>{label}</div>
            <div className={styles.editor}>
                <Sidebar {...theme} />
                <div className={styles.main}>
                    <Code theme={theme} />
                    <Float theme={theme} />
                    <Diff theme={theme} />
                </div>
            </div>
            <Statusline {...theme} />
            <Terminal {...theme} />
            <Ratios theme={theme} />
        </div>
    );
}
