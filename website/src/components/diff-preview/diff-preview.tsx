import type * as Theme from "@black-atom/core";
import { themeToPreviewProperties } from "#/lib/preview-vars.ts";
import { tokenize } from "#/lib/tokenize-code.ts";
import styles from "./diff-preview.module.css";

type Kind = "context" | "add" | "delete" | "modify";

type Row =
    | { kind: "hunk"; text: string }
    | { kind: Kind; lineNumber?: number; depth: number; code: string };

const rows: readonly Row[] = [
    { kind: "hunk", text: "@@ -1,4 +1,4 @@" },
    { kind: "context", lineNumber: 1, depth: 0, code: "// Load the active theme from disk" },
    {
        kind: "modify",
        lineNumber: 2,
        depth: 0,
        code: 'import { readFile } from "node:fs";',
    },
    { kind: "context", lineNumber: 3, depth: 0, code: "" },
    { kind: "hunk", text: "@@ -12,6 +12,9 @@ load" },
    { kind: "context", lineNumber: 12, depth: 0, code: "export function load(file: string) {" },
    { kind: "context", lineNumber: 13, depth: 1, code: "const raw = readFile(file);" },
    { kind: "delete", depth: 1, code: "return JSON.parse(raw);" },
    { kind: "add", lineNumber: 14, depth: 1, code: "const theme = JSON.parse(raw);" },
    { kind: "add", lineNumber: 15, depth: 1, code: "if (!theme.name) {" },
    { kind: "add", lineNumber: 16, depth: 2, code: 'throw new Error("missing name");' },
    { kind: "add", lineNumber: 17, depth: 1, code: "}" },
    { kind: "modify", lineNumber: 18, depth: 1, code: "return theme;" },
    { kind: "context", lineNumber: 19, depth: 0, code: "}" },
];

const signs: Record<Kind, string> = { context: "  ", add: "+ ", delete: "- ", modify: "~ " };

function countOf(kind: Kind): number {
    return rows.filter((row) => row.kind === kind).length;
}

type Props = {
    theme: Theme.Definition;
    /** Replaces the theme's border color: the Before story draws idle lines in subtle text. */
    borderColor?: string;
    /** A caption above the diff, such as `Before · HEAD`. */
    label?: string;
};

/** A mock diff of one file in one theme: a header with change counts and two hunks. */
export function DiffPreview({ theme, borderColor, label }: Props) {
    return (
        <div
            data-component="DiffPreview"
            className={styles.root}
            style={themeToPreviewProperties(theme, { borderColor })}
        >
            {label !== undefined && <p className={styles.label}>{label}</p>}
            <div className={styles.frame} role="group" aria-label="Diff preview">
                <div className={styles.head}>
                    <span>load.ts</span>
                    <span className={styles.grow}>working tree ↔ HEAD</span>
                    <span className={styles.add}>+{countOf("add")}</span>
                    <span className={styles.delete}>-{countOf("delete")}</span>
                    <span className={styles.modify}>~{countOf("modify")}</span>
                </div>
                <div className={styles.body} tabIndex={0} aria-label="Diff lines">
                    {rows.map((row, index) =>
                        row.kind === "hunk" ? (
                            <div key={index} className={styles.hunk}>
                                {row.text}
                            </div>
                        ) : (
                            <div
                                key={index}
                                className={styles.row}
                                style={
                                    row.kind === "context"
                                        ? undefined
                                        : { background: `var(--tp-bg-${row.kind})` }
                                }
                            >
                                <span className={styles.number}>{row.lineNumber ?? ""}</span>
                                <span
                                    className={styles.sign}
                                    style={
                                        row.kind === "context"
                                            ? undefined
                                            : { color: `var(--tp-fg-${row.kind})` }
                                    }
                                >
                                    {signs[row.kind]}
                                </span>
                                <span className={styles.guides} aria-hidden="true">
                                    {"│ ".repeat(row.depth)}
                                </span>
                                <span>
                                    {tokenize(row.code).map(([text, group], tokenIndex) => (
                                        <span
                                            key={tokenIndex}
                                            style={{
                                                color:
                                                    group === undefined
                                                        ? "var(--tp-fg-default)"
                                                        : `var(--tp-syn-${group})`,
                                            }}
                                        >
                                            {text}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
