import { wcagContrast } from "culori";
import { wcagGrade } from "./wcag.ts";
import type { WcagGrade } from "./wcag.ts";
import type * as Theme from "../types/theme.ts";

/** A defined fg/bg key pairing that occurs in real UI. */
export interface PairingDef {
    fg: string;
    bg: string;
}

/** A category of intended pairings. */
export interface PairingCategory {
    name: string;
    pairs: PairingDef[];
}

/** Computed contrast result for a single pairing. */
export interface ContrastPair {
    fg: { key: string; color: string };
    bg: { key: string; color: string };
    ratio: number;
    level: WcagGrade;
}

/** Computed category with resolved contrast pairs. */
export interface ContrastCategory {
    name: string;
    pairs: ContrastPair[];
}

/** Full contrast analysis result for a theme. */
export interface ThemeContrastAnalysis {
    primary: ContrastPair;
    categories: ContrastCategory[];
    passRate: { aa: number; aaa: number };
    worstPair: ContrastPair;
}

/**
 * Global intended pairings config.
 * Defines which fg/bg combinations actually occur in real UI.
 * Exported so adapters/tools can reference it.
 */
export const INTENDED_PAIRINGS: PairingCategory[] = [
    {
        name: "Content on surfaces",
        pairs: [
            { fg: "fg.default", bg: "bg.default" },
            { fg: "fg.default", bg: "bg.panel" },
            { fg: "fg.default", bg: "bg.float" },
            { fg: "fg.subtle", bg: "bg.default" },
            { fg: "fg.subtle", bg: "bg.panel" },
            { fg: "fg.subtle", bg: "bg.float" },
            { fg: "fg.accent", bg: "bg.default" },
            { fg: "fg.accent", bg: "bg.panel" },
            { fg: "fg.accent", bg: "bg.float" },
            { fg: "fg.disabled", bg: "bg.default" },
        ],
    },
    {
        name: "Interactive states",
        pairs: [
            { fg: "fg.default", bg: "bg.active" },
            { fg: "fg.default", bg: "bg.hover" },
            { fg: "fg.default", bg: "bg.selection" },
            { fg: "fg.default", bg: "bg.search" },
        ],
    },
    {
        name: "Feedback",
        pairs: [
            { fg: "fg.negative", bg: "bg.negative" },
            { fg: "fg.warn", bg: "bg.warn" },
            { fg: "fg.positive", bg: "bg.positive" },
            { fg: "fg.info", bg: "bg.info" },
            { fg: "fg.hint", bg: "bg.hint" },
            { fg: "fg.negative", bg: "bg.default" },
            { fg: "fg.warn", bg: "bg.default" },
            { fg: "fg.positive", bg: "bg.default" },
            { fg: "fg.info", bg: "bg.default" },
            { fg: "fg.hint", bg: "bg.default" },
        ],
    },
    {
        name: "Diff",
        pairs: [
            { fg: "fg.add", bg: "bg.add" },
            { fg: "fg.delete", bg: "bg.delete" },
            { fg: "fg.modify", bg: "bg.modify" },
        ],
    },
    {
        name: "Contrast inversion",
        pairs: [{ fg: "fg.contrast", bg: "bg.contrast" }],
    },
    {
        name: "Syntax",
        pairs: [
            "variable",
            "string",
            "boolean",
            "number",
            "property",
            "constant",
            "module",
            "type",
            "attribute",
            "func",
            "constructor",
            "operator",
            "keyword",
            "punctuation",
            "comment",
            "tag",
        ].map((group) => ({ fg: `syntax.${group}.default`, bg: "bg.default" })),
    },
    {
        // Black, light gray and white sit near one of the two backgrounds by
        // terminal convention, so only the slots that carry text are listed.
        name: "Terminal palette",
        pairs: [
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
        ].map((slot) => ({ fg: `palette.${slot}`, bg: "bg.default" })),
    },
];

/** Resolves a dot-path key to a hex color from a theme. `fg.<token>` and
 *  `bg.<token>` are short for `ui.fg.<token>` and `ui.bg.<token>`. */
function resolveColor(theme: Theme.Definition, key: string) {
    const path = key.startsWith("fg.") || key.startsWith("bg.") ? `ui.${key}` : key;
    const color = path
        .split(".")
        .reduce<unknown>((node, segment) => (node as Record<string, unknown>)?.[segment], theme);
    if (typeof color !== "string") {
        throw new Error(`resolveColor: token "${key}" not found in theme "${theme.meta.key}"`);
    }
    return color;
}

/** Computes a ContrastPair from a theme and a pairing definition. */
function computePair(theme: Theme.Definition, def: PairingDef): ContrastPair {
    const fgColor = resolveColor(theme, def.fg);
    const bgColor = resolveColor(theme, def.bg);
    const ratio = wcagContrast(fgColor, bgColor);
    return {
        fg: { key: def.fg, color: fgColor },
        bg: { key: def.bg, color: bgColor },
        ratio,
        level: wcagGrade(ratio),
    };
}

/**
 * Analyzes a theme against all intended fg/bg pairings.
 * Returns pass rates, worst pair, and all pairs grouped by category.
 */
export function analyzeThemeContrast(theme: Theme.Definition): ThemeContrastAnalysis {
    const categories: ContrastCategory[] = INTENDED_PAIRINGS.map((cat) => ({
        name: cat.name,
        pairs: cat.pairs.map((def) => computePair(theme, def)),
    }));

    const allPairs = categories.flatMap((c) => c.pairs);
    const total = allPairs.length;
    const aaCount = allPairs.filter((p) => p.level === "AA" || p.level === "AAA").length;
    const aaaCount = allPairs.filter((p) => p.level === "AAA").length;

    const primary = computePair(theme, { fg: "fg.default", bg: "bg.default" });

    const worstPair = allPairs.reduce((worst, p) => (p.ratio < worst.ratio ? p : worst));

    return {
        primary,
        categories,
        passRate: { aa: aaCount / total, aaa: aaaCount / total },
        worstPair,
    };
}
