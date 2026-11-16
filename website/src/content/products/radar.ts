import type { Product } from "./types.ts";

const clipSize = { width: 1444, height: 776 } as const;

export const radar = {
    key: "radar",
    name: "radar.nvim",
    number: "03",
    kicker: "Neovim plugin",
    tagline: "Jump between your working files with two keystrokes.",
    lead: [
        "Most of a day happens in about ten files. radar keeps them in a small HUD at the bottom of the pane, each one key after ",
        { kbd: "space" },
        ": locks on the home row, recent files on the numbers, the alternative file on ",
        { kbd: "o" },
        ". Your fuzzy finder keeps the rest. Kept per project and git branch.",
    ],
    description:
        "radar.nvim keeps the files you work on in a small HUD at the bottom of the pane, each one two keystrokes away, per project and git branch.",
    summary: [
        "Your working set in a small HUD at the bottom of the pane: locks on the home row, recent files on the numbers, the alternative file on o. Kept per project and git branch.",
    ],
    platform: "Neovim",
    facts: ["Neovim", "MIT"],
    repoUrl: "https://github.com/black-atom-industries/radar.nvim",
    changelog: { repo: "black-atom-industries/radar.nvim", paths: [], sections: [] },
    artLabel:
        "A radar sweep over your working files, and the Lock HUD listing them with their keys",
    steps: {
        id: "keys",
        title: "The keys",
        items: [
            {
                title: "Lock what you work on",
                body: [
                    { kbd: "space" },
                    " ",
                    { kbd: "l" },
                    " locks the current file to the next free slot on the home row.",
                ],
            },
            {
                title: "Jump with two keys",
                body: [
                    { kbd: "space" },
                    " ",
                    { kbd: "a" },
                    " opens the first lock, ",
                    { kbd: "space" },
                    " ",
                    { kbd: "1" },
                    " the most recent file, ",
                    { kbd: "space" },
                    " ",
                    { kbd: "o" },
                    " the alternative file.",
                ],
            },
            {
                title: "Rearrange as text",
                body: [
                    { kbd: "space" },
                    " ",
                    { kbd: "e" },
                    " opens the locks as lines. Delete, reorder, ",
                    { mono: ":w" },
                    ", and the keys follow.",
                ],
            },
            {
                title: "Tabs too",
                body: [
                    { kbd: "space" },
                    " ",
                    { kbd: "t" },
                    " shows every tab and its buffers where the HUD sits.",
                ],
            },
        ],
    },
    keymap: {
        title: "After space",
        rows: [
            { keys: ["a", "s", "d", "f", "g"], label: "locks" },
            { keys: ["1", "2", "3", "4", "5"], label: "recent files" },
            { keys: ["o"], label: "alternative file" },
            { keys: ["l", "e", "t", "h", "?"], label: "lock · edit · tabs · toggle HUD · help" },
        ],
        note: "Eleven files, two keys each, left hand on the home row. The prefix is yours to change.",
    },
    demos: {
        layout: "grid",
        items: [
            {
                kicker: "Jump",
                title: "Two keys to any file in view",
                body: ["Lock, alternative, recent: the HUD shows the key next to every file."],
                media: {
                    src: "/media/radar-0.6.0-hud-jump.webp",
                    alt: "Jumping from the Lock HUD to a lock, the alternative file and a recent file",
                    ...clipSize,
                },
            },
            {
                kicker: "Splits",
                title: "Follows the active pane",
                body: [
                    "The HUD moves with the split you're in and flips to the top when the cursor runs under it.",
                ],
                media: {
                    src: "/media/radar-0.6.0-hud-split.webp",
                    alt: "The HUD following the active split and moving out of the cursor's way",
                    ...clipSize,
                },
            },
            {
                kicker: "Editor",
                title: "Locks are just lines",
                body: ["Reorder with the editing you already know, write, done."],
                media: {
                    src: "/media/radar-0.6.0-hud-edit.webp",
                    alt: "Reordering locks in the lock editor",
                    ...clipSize,
                },
            },
            {
                kicker: "Tabs",
                title: "Every tab at a glance",
                body: ["Tabs and their buffers, with git and LSP state, where the HUD sits."],
                media: {
                    src: "/media/radar-0.7.0-tabs.webp",
                    alt: "The Tab HUD listing tabs and their buffers",
                    ...clipSize,
                },
            },
        ],
    },
    features: [
        {
            title: "Per project and branch",
            body: ["Switch branches and your locks and recent files switch with you."],
        },
        {
            title: "Out of the way",
            body: [
                "The HUD dodges the cursor line, or stays put at the bottom if you prefer scrolloff.",
            ],
        },
        {
            title: "Survives restarts",
            body: [
                "Locks and recent files are saved with atomic writes. ",
                { mono: ":RadarCleanup" },
                " clears out deleted branches.",
            ],
        },
        {
            title: "Open it your way",
            body: ["From the lock editor, open a file in the window, a split, a tab or a float."],
        },
        {
            title: "Directories too",
            body: ["Oil directory buffers work as locks and recent files."],
        },
        {
            title: "Your theme",
            body: ["The HUD uses your colourscheme's own highlight groups."],
        },
    ],
    install: {
        methods: [
            {
                id: "lazy",
                label: "lazy.nvim",
                lines: [
                    { text: "{" },
                    { text: "  'black-atom-industries/radar.nvim'," },
                    { text: "  opts = {}," },
                    { text: "}" },
                ],
                note: "Other plugin managers: call require('radar').setup() yourself.",
            },
            {
                id: "prefix",
                label: "custom prefix",
                lines: [
                    { text: "{" },
                    { text: "  'black-atom-industries/radar.nvim'," },
                    { text: "  opts = { keys = { prefix = ',' } }," },
                    { text: "}" },
                ],
                note: "If space is your leader, give radar the other key so Neovim doesn't wait between the two.",
            },
        ],
    },
} as const satisfies Product;

/** The Lock HUD shown beside the hero: the current file, the alternative, locks and recent files. */
export const radarHud = [
    [
        { key: "%", file: "src/app.ts", isCurrent: true },
        { key: "o", file: "src/app.test.ts" },
    ],
    [
        { key: "a", file: "src/router.ts" },
        { key: "s", file: "src/store.ts" },
        { key: "d", file: "README.md" },
    ],
    [
        { key: "1", file: "src/api/client.ts", isRecent: true },
        { key: "2", file: "package.json", isRecent: true },
        { key: "3", file: "src/ui/list.ts", isRecent: true },
    ],
] as const;
