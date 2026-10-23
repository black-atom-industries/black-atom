import { collectionOrder, themeKeys } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import type { Product } from "./types.ts";

export type Adapter = {
    id: string;
    kind: string;
    /** How to hook the tool up without Livery. */
    manual: string;
    /** Extensions of the files generated per theme. */
    extensions: readonly string[];
    isSwitchedByLivery: boolean;
};

export const adapters = [
    {
        id: "ghostty",
        kind: "terminal",
        manual: "Copy the .conf, set theme =",
        extensions: ["conf"],
        isSwitchedByLivery: true,
    },
    {
        id: "wezterm",
        kind: "terminal",
        manual: "Copy the .toml, set color_scheme",
        extensions: ["toml"],
        isSwitchedByLivery: false,
    },
    {
        id: "tmux",
        kind: "multiplexer",
        manual: "source-file the .conf",
        extensions: ["conf"],
        isSwitchedByLivery: true,
    },
    {
        id: "herdr",
        kind: "agent multiplexer",
        manual: "Paste the colour block",
        extensions: ["toml"],
        isSwitchedByLivery: true,
    },
    {
        id: "nvim",
        kind: "editor",
        manual: "Add to runtimepath, :colorscheme",
        extensions: ["lua"],
        isSwitchedByLivery: true,
    },
    {
        id: "zed",
        kind: "editor",
        manual: "Copy the .json, set theme",
        extensions: ["json"],
        isSwitchedByLivery: true,
    },
    {
        id: "obsidian",
        kind: "notes",
        manual: "Copy into .obsidian/themes",
        extensions: ["css"],
        isSwitchedByLivery: true,
    },
    {
        id: "lazygit",
        kind: "git TUI",
        manual: "Merge gui.theme into config.yml",
        extensions: ["yml"],
        isSwitchedByLivery: true,
    },
    {
        id: "delta",
        kind: "git pager",
        manual: "Include the .gitconfig",
        extensions: ["gitconfig"],
        isSwitchedByLivery: true,
    },
    {
        id: "tuicr",
        kind: "review TUI",
        manual: "Copy themes, set theme =",
        extensions: ["toml", "tmTheme"],
        isSwitchedByLivery: true,
    },
    {
        id: "claude-code",
        kind: "coding agent",
        manual: "Copy the .json, pick with /theme",
        extensions: ["json"],
        isSwitchedByLivery: true,
    },
    {
        id: "kagi",
        kind: "search",
        manual: "Paste into custom CSS",
        extensions: ["css"],
        isSwitchedByLivery: false,
    },
    {
        id: "niri",
        kind: "compositor",
        manual: "include the .kdl",
        extensions: ["kdl"],
        isSwitchedByLivery: false,
    },
    {
        id: "waybar",
        kind: "status bar",
        manual: "@import the colours",
        extensions: ["css"],
        isSwitchedByLivery: false,
    },
] as const satisfies readonly Adapter[];

export const switchedAdapters = adapters.filter((adapter) => adapter.isSwitchedByLivery);
export const manualAdapters = adapters.filter((adapter) => !adapter.isSwitchedByLivery);

export const themeCount = themeKeys.length;
export const collectionCount = collectionOrder.length;

export const collectionBlurbs = {
    default: "The baseline.",
    facility: "Slate, with quieter mids.",
    terra: "Four seasons, each in dark and light.",
    jpn: "Soft and desaturated, after Japanese colour.",
    minium: "Neutral greys with an orange accent.",
    mono: "Monochrome.",
} as const satisfies Record<Theme.CollectionKey, string>;

const repoUrl = "https://github.com/black-atom-industries/black-atom";

export const blackAtom = {
    key: "black-atom",
    name: "Black Atom",
    number: "01",
    kicker: "Theme system",
    tagline: "Colour themes, written once and generated for every tool you use.",
    lead: [
        `Black Atom starts from black. Colour falls in, and what comes back out is colour you can work with all day: ${themeCount} dark and light themes, each written once and generated for your terminal, your editor and the rest of your desktop. Same colours, wherever you look.`,
    ],
    description: `Black Atom: ${themeCount} dark and light colour themes, each written once and generated for ${adapters.length} tools, from your terminal and editor to the rest of your desktop.`,
    summary: [
        `${themeCount} dark and light themes in ${collectionCount} collections, generated for ${adapters.length} tools. Livery, the desktop app, switches ${switchedAdapters.length} of them and your system appearance in one go.`,
    ],
    release: { version: "v0.11.0", date: "2026-10-15" },
    platform: "macOS app · any OS for the theme files",
    facts: [],
    repoUrl,
    changelog: { repo: "black-atom-industries/black-atom", paths: ["core/", "adapters/"] },
    install: {
        methods: [
            {
                id: "hand",
                label: "theme files",
                lines: [
                    { text: "Every folder in adapters/ has the generated files" },
                    { text: "and a short README on hooking that tool up by hand." },
                ],
                note: "Works on any OS. No install needed.",
            },
            {
                id: "source",
                label: "Livery · source",
                lines: [
                    { prompt: "$ ", text: `git clone ${repoUrl}` },
                    { prompt: "$ ", text: "cd black-atom && npm install" },
                    { prompt: "$ ", text: "npm run install:macos" },
                ],
                note: "macOS. Needs Node 24.11+ and Rust. Installs livery.app and the livery command.",
            },
            { id: "dmg", label: ".dmg", lines: [], isSoon: true },
            { id: "brew", label: "brew", lines: [], isSoon: true },
            { id: "mise", label: "mise", lines: [], isSoon: true },
            { id: "npm", label: "npm", lines: [], isSoon: true },
        ],
    },
} as const satisfies Product;

export const blackAtomLinks = {
    adapters: `${repoUrl}/tree/main/adapters`,
    definitions: `${repoUrl}/tree/main/core/src/themes`,
    files: `${repoUrl}/blob/main/`,
} as const;

export const themesIntro =
    "Each card shows the theme in its own colours. Wear one to see the whole site in it, or open its documentation.";

/** How a theme is made, in three steps from definition to file. */
export const writtenOnce = {
    title: "Written once",
    intro: "Every theme is one definition. A ramp of primaries and a few accents go in, the generator derives the rest, and every tool gets a file in its own format. Change the definition and every tool changes with it.",
    definition: {
        kicker: "1 · Definition",
        title: "Primaries and accents",
        body: "Twelve steps from dark to light, plus up to four accents. That is all a theme author picks.",
    },
    tokens: {
        kicker: "2 · Tokens",
        title: "UI, syntax, palette, feedback",
        items: [
            { name: "ui.bg.panel", color: "var(--ba-bg-panel)" },
            { name: "ui.fg.accent", color: "var(--ba-accent)" },
            { name: "syntax.keyword", color: "var(--ba-syn-keyword)" },
            { name: "syntax.string", color: "var(--ba-syn-string)" },
            { name: "palette.red", color: "var(--ba-c-red)" },
            { name: "feedback.warning", color: "var(--ba-warning)" },
        ],
    },
    tools: {
        kicker: "3 · Tools",
        title: "One file per tool",
        body: "Generated files are committed, so every one is readable on GitHub before you use it.",
    },
} as const;
