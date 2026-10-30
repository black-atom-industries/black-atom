import type * as Theme from "@black-atom/core";

/** Syntax groups that carry a `default` color. */
type SyntaxGroup = Exclude<keyof Theme.Syntax, "markup">;

export type Token = [text: string, group: SyntaxGroup | undefined];

export type Change = "add" | "modify" | "delete";

export type Feedback = "negative" | "warn" | "info" | "hint";

export const code = [
    "// Load the active theme from disk",
    'import { readFile } from "node:fs";',
    "export async function load(file: string): Promise<Theme> {",
    "  const MAX = 42, strict = true;",
    '  if (file.length > MAX) throw new Error("too long");',
    "  return path.parse(await readFile(file));",
    "}",
    '<div class="theme"/>',
];

export const cursorLine = 3;
export const selectedLine = 5;
export const searchWord = "readFile";

export const diagnostics: Record<number, [Feedback, string]> = {
    2: ["warn", "unused parameter"],
    4: ["negative", "Error is not defined"],
    6: ["info", "returns Theme"],
    7: ["hint", "prefer className"],
};

export const gitSigns: Record<number, Change> = { 2: "modify", 3: "add", 4: "add", 7: "delete" };

export const hunk = "@@ -12,10 +12,13 @@ export function load";

export const diff: [Change | "context", string][] = [
    ["context", "export function load(file: string): Theme {"],
    ["context", "    const raw = readFile(file);"],
    ["delete", "    return JSON.parse(raw);"],
    ["add", "    const theme = JSON.parse(raw);"],
    ["add", "    if (!theme.name) {"],
    ["add", '        throw new Error("missing name");'],
    ["add", "    }"],
    ["add", "    return theme;"],
    ["context", "}"],
    ["context", ""],
    ["delete", "function legacy(raw: string) {"],
    ["delete", "    return raw.trim(); // unused"],
    ["delete", "}"],
    ["modify", "export const VERSION = 3;"],
];

export const diffStart = 12;

export const terminalSlots = [
    "gray",
    "darkRed",
    "red",
    "darkGreen",
    "green",
    "darkYellow",
    "yellow",
    "darkBlue",
    "blue",
    "darkMagenta",
    "magenta",
    "darkCyan",
    "cyan",
] satisfies (keyof Theme.Palette)[];

export const uiPairs = [
    "fg.default|bg.default",
    "fg.subtle|bg.default",
    "fg.accent|bg.default",
    "fg.disabled|bg.default",
    "fg.default|bg.panel",
    "fg.subtle|bg.panel",
    "fg.default|bg.float",
    "fg.default|bg.active",
    "fg.default|bg.hover",
    "fg.default|bg.selection",
    "fg.default|bg.search",
    "fg.negative|bg.negative",
    "fg.warn|bg.warn",
    "fg.info|bg.info",
    "fg.hint|bg.hint",
    "fg.positive|bg.positive",
    "fg.add|bg.add",
    "fg.delete|bg.delete",
    "fg.modify|bg.modify",
    "fg.contrast|bg.contrast",
];

const keywords = new Set([
    "import",
    "from",
    "export",
    "async",
    "function",
    "const",
    "if",
    "throw",
    "new",
    "return",
    "await",
]);

const booleans = new Set(["true", "false"]);

function wordGroup(word: string, before: string, after: string): SyntaxGroup {
    if (keywords.has(word)) return "keyword";
    if (booleans.has(word)) return "boolean";
    if (/^\s*<\/?$/.test(before)) return "tag";
    if (/^\s*</.test(before) && /^=[^=]/.test(after)) return "attribute";
    if (/^[A-Z][A-Z_\d]+$/.test(word)) return "constant";
    if (/^[A-Z]/.test(word)) return before.endsWith("new ") ? "constructor" : "type";
    if (after.startsWith("(")) return "func";
    if (before.endsWith(".")) return "property";
    return "variable";
}

/** Splits a line of TypeScript or JSX into syntax groups, enough for a preview. */
export function tokenize(text: string): Token[] {
    const commentAt = text.indexOf("//");
    const source = commentAt > -1 ? text.slice(0, commentAt) : text;
    const tokens: Token[] = [];
    for (const match of source.matchAll(/"[^"]*"|\d+|[A-Za-z_]\w*|\s+|./g)) {
        const word = match[0];
        const at = match.index;
        const before = source.slice(0, at);
        const after = source.slice(at + word.length);
        if (word.startsWith('"')) tokens.push([word, "string"]);
        else if (/^\d/.test(word)) tokens.push([word, "number"]);
        else if (/^\s/.test(word)) tokens.push([word, undefined]);
        else if (/^\w/.test(word)) tokens.push([word, wordGroup(word, before, after)]);
        else if (/[=<>!+\-*/&|]/.test(word)) tokens.push([word, "operator"]);
        else tokens.push([word, "punctuation"]);
    }
    if (commentAt > -1) tokens.push([text.slice(commentAt), "comment"]);
    return tokens;
}
