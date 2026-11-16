import type * as Theme from "@black-atom/core";

type Sign = "add" | "modify" | "delete";

type Diagnostic = {
    level: "warn" | "negative" | "info" | "hint";
    text: string;
};

/** A character range inside one line's code: a search match or a selection. */
export type Mark = {
    from: number;
    to: number;
    kind: "search" | "selection";
};

export type CodeLine = {
    code: string;
    /** Indent guides drawn before the code. */
    depth: number;
    sign?: Sign;
    isCurrent?: boolean;
    diagnostic?: Diagnostic;
    marks?: readonly Mark[];
    /** Opens a hover box under the line. */
    hasHover?: boolean;
};

export const loadLines: readonly CodeLine[] = [
    { code: "// Load the active theme from disk", depth: 0 },
    {
        code: 'import { readFile } from "node:fs";',
        depth: 0,
        marks: [{ from: 9, to: 17, kind: "search" }],
    },
    {
        code: "export function load(file: string): Theme {",
        depth: 0,
        sign: "modify",
        hasHover: true,
    },
    {
        code: "const MAX = 42, strict = true;",
        depth: 1,
        sign: "add",
        isCurrent: true,
        diagnostic: { level: "warn", text: "unused" },
    },
    { code: "if (file.length > MAX) {", depth: 1, sign: "add" },
    {
        code: 'throw new Error("too long");',
        depth: 2,
        diagnostic: { level: "negative", text: "undefined" },
    },
    { code: "}", depth: 1 },
    { code: "for (const line of lines) {", depth: 1 },
    { code: 'if (line.startsWith("#")) {', depth: 2 },
    { code: "continue;", depth: 3, diagnostic: { level: "info", text: "skips comments" } },
    { code: "}", depth: 2 },
    { code: "}", depth: 1 },
    {
        code: "return parse(readFile(file));",
        depth: 1,
        sign: "delete",
        marks: [
            { from: 7, to: 13, kind: "selection" },
            { from: 13, to: 21, kind: "search" },
            { from: 21, to: 28, kind: "selection" },
        ],
    },
    { code: "}", depth: 0 },
];

export const loadSignature = "load(file: string): Theme";
export const loadDoc = "Reads and parses a theme file.";

export type TreeRow = {
    depth: number;
    name: string;
    /** A `--tp-fg-*` token name. */
    tone: "subtle" | "default" | "add" | "modify" | "delete" | "disabled";
    /** The editor tab this file opens, if any. */
    tab?: "load.ts" | "theme.ts";
    isHovered?: boolean;
};

export const treeRows: readonly TreeRow[] = [
    { depth: 0, name: "▾ src", tone: "subtle" },
    { depth: 1, name: "▾ lib", tone: "subtle" },
    { depth: 2, name: "load.ts", tone: "default", tab: "load.ts" },
    { depth: 2, name: "parse.ts", tone: "default", isHovered: true },
    { depth: 2, name: "theme.ts  M", tone: "modify", tab: "theme.ts" },
    { depth: 1, name: "new.ts  A", tone: "add" },
    { depth: 1, name: "old.ts  D", tone: "delete" },
    { depth: 0, name: "▸ dist", tone: "disabled" },
    { depth: 0, name: "README.md", tone: "default" },
];

export function themeLines(theme: Theme.Definition): readonly CodeLine[] {
    return [
        { code: 'import type { Theme } from "./types";', depth: 0 },
        { code: " ", depth: 0 },
        { code: "export const theme: Theme = {", depth: 0, isCurrent: true },
        { code: `name: "${theme.meta.name}",`, depth: 1, sign: "modify" },
        { code: `appearance: "${theme.meta.appearance}",`, depth: 1 },
        { code: "contrast: 4.5,", depth: 1, diagnostic: { level: "hint", text: "WCAG AA" } },
        { code: "released: true,", depth: 1 },
        { code: "ui: {", depth: 1 },
        { code: "bg: primaries.d20,", depth: 2 },
        { code: "border: primaries.m10,", depth: 2, sign: "add" },
        { code: "},", depth: 1 },
        { code: "};", depth: 0 },
    ];
}
