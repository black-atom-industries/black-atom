import type { Product } from "./types.ts";

const screenSize = { width: 1280, height: 720 } as const;

export const livery = {
    key: "livery",
    name: "Livery",
    number: "05",
    kicker: "Desktop app · macOS",
    lead: [
        "Pick a theme once and your terminal, editor, git tools and system appearance follow. Livery is the Black Atom desktop app, with a ",
        { mono: "livery" },
        " command for when you'd rather stay in the terminal.",
    ],
    description:
        "Livery is the Black Atom desktop app for macOS: pick a theme once and your terminal, editor, git tools and system appearance follow.",
    summary: [
        "Changing your theme tool by tool gets old fast. Livery is the desktop app that does it in one go: pick a theme and every supported tool on your machine follows, along with your system appearance. If you'd rather stay in the terminal, there's a ",
        { mono: "livery" },
        " command too.",
    ],
    platform: "macOS",
    facts: ["macOS", "MIT"],
    repoUrl: "https://github.com/black-atom-industries/black-atom",
    changelog: {
        repo: "black-atom-industries/black-atom",
        paths: ["livery/"],
        sections: ["Livery"],
    },
    steps: {
        id: "apply",
        title: "What apply does",
        items: [
            {
                title: "You pick a theme",
                body: [
                    "In the app, or with ",
                    { mono: "livery apply" },
                    ". Livery records it as the active theme.",
                ],
            },
            {
                title: "Theme files land where each tool expects them",
                body: [
                    "Linked for tools that read a theme file, merged into the config for tools that keep colours inline.",
                ],
            },
            {
                title: "The switch line is rewritten",
                body: [
                    "The one line in each config that names the theme. Livery rewrites it, it never adds it, so you add it once when you set a tool up.",
                ],
            },
            {
                title: "Running tools reload",
                body: [
                    "Ghostty, tmux, Neovim, herdr and Obsidian pick the new colours up without a restart.",
                ],
            },
            {
                title: "Your system follows",
                body: ["A light theme switches macOS to light appearance, a dark one to dark."],
            },
        ],
    },
    install: {
        methods: [
            {
                id: "source",
                label: "source",
                lines: [
                    {
                        prompt: "$ ",
                        text: "git clone https://github.com/black-atom-industries/black-atom",
                    },
                    { prompt: "$ ", text: "cd black-atom && npm install" },
                    { prompt: "$ ", text: "npm run install:macos" },
                ],
                note: "macOS. Needs Node 24.11+ and Rust. Installs livery.app and the livery command, then run livery setup.",
            },
            { id: "dmg", label: ".dmg", lines: [], isSoon: true },
            { id: "brew", label: "brew", lines: [], isSoon: true },
            { id: "mise", label: "mise", lines: [], isSoon: true },
            { id: "npm", label: "npm", lines: [], isSoon: true },
        ],
    },
} as const satisfies Product;

export const liveryScreens = [
    {
        src: "/media/livery-theme-list.png",
        alt: "Theme list grouped by collection",
        caption: "Themes by collection. j and k move, the datasheet follows.",
        ...screenSize,
    },
    {
        src: "/media/livery-theme-detail.png",
        alt: "Theme detail with swatches and a code preview",
        caption: "The datasheet: swatches, values and a code preview of the theme.",
        ...screenSize,
    },
    {
        src: "/media/livery-settings.png",
        alt: "Settings for the delta adapter",
        caption: "Settings: detect a tool, set it up once, and Livery keeps it in step.",
        ...screenSize,
    },
] as const;

/** Livery's main view, as the Black Atom page shows it. */
export const liveryMainView = {
    ...liveryScreens[0],
    alt: "Livery's main view: themes grouped by collection",
    caption: "Livery's main view: themes by collection, the datasheet, and the apply rail.",
} as const;

export const liveryManualNote =
    "These have generated theme files in the repo; Livery doesn't switch them yet.";

export const liveryIcon = { src: "/media/livery-icon.png" } as const;

export const liveryCommands = {
    title: "In the terminal",
    intro: [
        "The core of it is a command too. Bind ",
        { mono: "livery apply" },
        " to a key, or call it from a script that follows the time of day.",
    ],
    example: [
        { prompt: "$ ", text: "livery apply black-atom-jpn-murasaki-light" },
        { prompt: "$ ", text: "livery status" },
    ],
    commands: [
        { command: "livery", description: "Pick a theme interactively" },
        { command: "livery apply [theme]", description: "Apply a theme to every enabled tool" },
        { command: "livery list", description: "List all themes" },
        { command: "livery status", description: "Show the active theme and each tool's state" },
        { command: "livery setup [--yes]", description: "Detect installed tools and enable them" },
        { command: "livery appearance dark|light", description: "Switch the system appearance" },
    ],
} as const;
