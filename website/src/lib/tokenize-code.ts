import type * as Theme from "@black-atom/core";

/** Syntax groups that carry a `default` color. */
export type SyntaxGroup = Exclude<keyof Theme.Syntax, "markup">;

export type Token = [text: string, group: SyntaxGroup | undefined];

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
