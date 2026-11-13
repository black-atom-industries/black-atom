import type * as Theme from "@black-atom/core";
import { cva } from "cva";
import { Fragment, useState } from "react";
import { themeToPreviewProperties } from "#/lib/preview-vars.ts";
import { type SyntaxGroup, tokenize } from "#/lib/tokenize-code.ts";
import {
    type CodeLine,
    loadDoc,
    loadLines,
    loadSignature,
    type Mark,
    themeLines,
    treeRows,
} from "./sample.ts";
import styles from "./editor-preview.module.css";

type Tab = "load.ts" | "theme.ts";

const tabs = [
    { key: "load.ts", label: "load.ts" },
    { key: "theme.ts", label: "theme.ts ●" },
] as const satisfies readonly { key: Tab; label: string }[];

const tabVariants = cva({
    base: styles.tab,
    variants: {
        isActive: { false: null, true: styles.activeTab },
    },
});

const markClasses = { search: styles.search, selection: styles.selection };

type Piece = {
    text: string;
    group: SyntaxGroup | undefined;
    kind: Mark["kind"] | undefined;
};

/** Splits a line into runs that share one syntax group and one mark. */
function highlight(code: string, marks: readonly Mark[]): Piece[] {
    const kindAt = (index: number) =>
        marks.find((mark) => index >= mark.from && index < mark.to)?.kind;
    const pieces: Piece[] = [];
    let index = 0;
    for (const [text, group] of tokenize(code)) {
        for (const char of text) {
            const kind = kindAt(index);
            const last = pieces.at(-1);
            if (last !== undefined && last.group === group && last.kind === kind) {
                last.text += char;
            } else {
                pieces.push({ text: char, group, kind });
            }
            index += 1;
        }
    }
    return pieces;
}

function Code({ code, marks = [] }: { code: string; marks?: readonly Mark[] }) {
    return highlight(code, marks).map((piece, index) => (
        <span
            key={index}
            className={piece.kind === undefined ? undefined : markClasses[piece.kind]}
            style={{
                color:
                    piece.group === undefined
                        ? "var(--tp-fg-default)"
                        : `var(--tp-syn-${piece.group})`,
            }}
        >
            {piece.text}
        </span>
    ));
}

function Line({ line, number }: { line: CodeLine; number: number }) {
    const signColor = line.sign === undefined ? undefined : `var(--tp-fg-${line.sign})`;
    return (
        <div className={line.isCurrent ? styles.currentLine : styles.line}>
            <span className={styles.sign} style={{ color: signColor }}>
                {line.sign === undefined ? " " : "▎"}
            </span>
            <span className={styles.number}>{String(number).padStart(2)}</span>
            <span className={styles.guides} aria-hidden="true">
                {"│ ".repeat(line.depth)}
            </span>
            <span>
                <Code code={line.code} marks={line.marks} />
            </span>
            {line.diagnostic && (
                <span
                    className={styles.diagnostic}
                    style={{
                        color: `var(--tp-fg-${line.diagnostic.level})`,
                        background: `var(--tp-bg-${line.diagnostic.level})`,
                    }}
                >
                    ● {line.diagnostic.text}
                </span>
            )}
        </div>
    );
}

type Props = {
    theme: Theme.Definition;
    /** Replaces the theme's border color: the Before story draws idle lines in subtle text. */
    borderColor?: string;
    /** A caption above the editor, such as `Before · HEAD`. */
    label?: string;
};

/** A mock code editor in one theme: two files, a tree, diagnostics and a status line. */
export function EditorPreview({ theme, borderColor, label }: Props) {
    const [tab, setTab] = useState<Tab>("load.ts");
    const lines = tab === "load.ts" ? loadLines : themeLines(theme);

    return (
        <div
            data-component="EditorPreview"
            className={styles.root}
            style={themeToPreviewProperties(theme, { borderColor })}
        >
            {label !== undefined && <p className={styles.label}>{label}</p>}
            <div className={styles.frame} role="group" aria-label="Editor preview">
                <div className={styles.tabs}>
                    {tabs.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={tabVariants({ isActive: tab === item.key })}
                            aria-pressed={tab === item.key}
                            onClick={() => setTab(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className={styles.body}>
                    <div className={styles.tree}>
                        {treeRows.map((row) => (
                            <div
                                key={row.name}
                                className={styles.treeRow}
                                data-active={row.tab === tab || undefined}
                                data-hovered={row.isHovered || undefined}
                                style={{ color: `var(--tp-fg-${row.tone})` }}
                            >
                                <span className={styles.guides} aria-hidden="true">
                                    {"│ ".repeat(row.depth)}
                                </span>
                                {row.name}
                            </div>
                        ))}
                    </div>
                    <div className={styles.code} tabIndex={0} aria-label="Code">
                        {lines.map((line, index) => (
                            <Fragment key={index}>
                                <Line line={line} number={index + 1} />
                                {line.hasHover && (
                                    <div className={styles.hover}>
                                        <div>
                                            <Code code={loadSignature} />
                                        </div>
                                        <div className={styles.hoverDoc}>{loadDoc}</div>
                                    </div>
                                )}
                            </Fragment>
                        ))}
                    </div>
                </div>
                <div className={styles.status}>
                    <b>NORMAL</b>
                    <span className={styles.branch}>main</span>
                    <span>{tab}</span>
                    <span className={styles.negative}>✘ 1</span>
                    <span className={styles.warn}>▲ 1</span>
                    <span className={styles.info}>● 1</span>
                    <span className={styles.positive}>✔ saved</span>
                </div>
            </div>
        </div>
    );
}
