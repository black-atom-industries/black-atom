import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import styles from "./editor-frame.module.css";

type Position = { line: number; col: number };

type Range = Position & { length: number };

export type EditorState = {
    cursor: Position;
    signs?: Record<number, "add" | "modify" | "delete">;
    search?: Range[];
    selection?: Range;
    diagnostic?: { line: number; message: string; severity: "negative" | "warn" };
    completion?: { label: string; kind: string }[];
};

export type EditorFile = {
    key: string;
    file: string;
    filetype: string;
    content: ReactNode;
    state: EditorState;
};

type Props = {
    files: EditorFile[];
};

const at = (line: number, col = 0, length = 0) =>
    ({ "--line": line, "--col": col, "--length": length }) as CSSProperties;

export function EditorFrame({ files }: Props) {
    const [active, setActive] = useState(files[0]?.key);
    const current = files.find((f) => f.key === active) ?? files[0];

    return (
        <Tabs.Root
            className={styles.root}
            value={active}
            onValueChange={(value) => setActive(value as string)}
            data-component="EditorFrame"
        >
            <Tabs.List className={styles.tabs}>
                {files.map(({ key, file }) => (
                    <Tabs.Tab key={key} value={key} className={styles.tab}>
                        {file}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
            {files.map(({ key, content, state }) => (
                <Tabs.Panel key={key} value={key}>
                    <EditorBody state={state}>{content}</EditorBody>
                </Tabs.Panel>
            ))}
            {current && <StatusLine file={current} />}
        </Tabs.Root>
    );
}

function EditorBody({ state, children }: { state: EditorState; children: ReactNode }) {
    const codeRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<string[]>([]);

    useLayoutEffect(() => {
        setLines(codeRef.current?.textContent?.split("\n") ?? []);
    }, [children]);

    const { cursor, signs, search, selection, diagnostic, completion } = state;
    const diagnosticCol = diagnostic ? (lines[diagnostic.line - 1]?.length ?? 0) + 3 : 0;

    return (
        <div className={styles.body}>
            <div className={styles.cursorLine} style={at(cursor.line)} />
            <div className={styles.gutter} aria-hidden>
                {lines.map((_, i) => {
                    const line = i + 1;
                    return (
                        <div key={line} className={styles.gutterRow}>
                            <span className={styles.sign} data-sign={signs?.[line]}>
                                {signs?.[line] === "delete" ? "▁" : signs?.[line] ? "▎" : ""}
                            </span>
                            <span
                                className={styles.number}
                                data-current={line === cursor.line || undefined}
                            >
                                {line}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className={styles.code}>
                {search?.map((range) => (
                    <span
                        key={`${range.line}:${range.col}`}
                        className={styles.search}
                        style={at(range.line, range.col, range.length)}
                    />
                ))}
                {selection && (
                    <span
                        className={styles.selection}
                        style={at(selection.line, selection.col, selection.length)}
                    />
                )}
                <span className={styles.cursor} style={at(cursor.line, cursor.col)} />
                <div ref={codeRef} className={styles.text}>
                    {children}
                </div>
                {diagnostic && (
                    <span
                        className={styles.diagnostic}
                        data-severity={diagnostic.severity}
                        style={at(diagnostic.line, diagnosticCol)}
                    >
                        {diagnostic.message}
                    </span>
                )}
                {completion && (
                    <div className={styles.completion} style={at(cursor.line + 1, cursor.col)}>
                        {completion.map(({ label, kind }, i) => (
                            <div
                                key={label}
                                className={styles.completionItem}
                                data-selected={i === 0 || undefined}
                            >
                                <span>{label}</span>
                                <span className={styles.completionKind}>{kind}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusLine({ file }: { file: EditorFile }) {
    const { cursor, diagnostic } = file.state;
    return (
        <div className={styles.status}>
            <span className={styles.mode}>{file.state.completion ? "INSERT" : "NORMAL"}</span>
            <span>src/{file.file}</span>
            <span>⎇ main</span>
            <span className={styles.grow} />
            <span className={styles.negative}>● {diagnostic?.severity === "negative" ? 1 : 0}</span>
            <span className={styles.warn}>▲ {diagnostic?.severity === "warn" ? 1 : 0}</span>
            <span>{file.filetype}</span>
            <span>
                {cursor.line}:{cursor.col + 1}
            </span>
        </div>
    );
}
