import type { Product } from "./types.ts";

const drawerSize = { width: 2654, height: 1520 } as const;

export const iter = {
    key: "iter",
    name: "iter.nvim",
    number: "02",
    kicker: "Neovim plugin",
    tagline: "Review, annotate, hand back, repeat.",
    lead: [
        "Whether the changes are yours or an agent's, iter is the review half of the loop. Read the diff, stage what is ready, annotate what is not, and hand the annotations back as a prompt. When the code changes again, you see what is new since your last pass.",
    ],
    description:
        "iter.nvim is the review half of the loop in Neovim: read the diff, stage what is ready, annotate what is not, and hand the annotations back as a prompt.",
    summary: [
        "The review half of the loop, whether the changes are yours or an agent's. Stage what is ready, annotate what is not, copy the annotations out as a prompt, and see what moved since your last pass.",
    ],
    platform: "Neovim 0.12+",
    facts: ["Neovim 0.12+", "git", "GPL-3.0"],
    repoUrl: "https://github.com/black-atom-industries/iter.nvim",
    changelog: { repo: "black-atom-industries/iter.nvim", paths: [], sections: [] },
    artLabel: "Changes flow into a review loop and come back out as a prompt",
    steps: {
        id: "loop",
        title: "The loop",
        items: [
            {
                title: "See what changed",
                body: [
                    { kbd: ":Iter" },
                    " opens the status drawer at the bottom. Move through the files and the diff of each shows above. ",
                    { kbd: "s" },
                    " ",
                    { kbd: "u" },
                    " ",
                    { kbd: "d" },
                    " stage, unstage and discard.",
                ],
            },
            {
                title: "Review",
                body: [
                    { kbd: "r" },
                    " opens the review tab. iter draws the diff itself, with treesitter syntax and the changed words picked out. ",
                    { kbd: "s" },
                    " stages the hunk under the cursor, or just the selected lines.",
                ],
            },
            {
                title: "Annotate",
                body: [
                    { kbd: "a" },
                    " annotates a line or range, ",
                    { kbd: "A" },
                    " the whole file. Annotations follow their code when it moves. ",
                    { kbd: "r" },
                    " marks a file reviewed and moves on.",
                ],
            },
            {
                title: "Hand back",
                body: [
                    { kbd: "y" },
                    " copies the review as a prompt: every annotation with its file, line and code. The agent works, files change, and reviewed files that moved come back marked ",
                    { mono: "↻" },
                    ".",
                ],
            },
        ],
    },
    demos: {
        layout: "rows",
        items: [
            {
                kicker: "Status drawer",
                title: "Every change, one keystroke away",
                body: [
                    "The branch, how far it is ahead and behind, Unstaged and Staged side by side, and the last commits pinned under the files.",
                ],
                media: {
                    src: "/media/drawer.webp",
                    alt: "The status drawer: moving through files previews each diff",
                    ...drawerSize,
                },
            },
            {
                kicker: "Review tab",
                title: "Read, annotate, move on",
                body: [
                    "The Annotations column lists every note with your progress on top. Moving onto one shows it in the diff.",
                ],
                media: {
                    src: "/media/review.webp",
                    alt: "The review tab: annotating a line, marking the file reviewed",
                    ...drawerSize,
                },
            },
            {
                kicker: "Layouts",
                title: "One file or all of them",
                body: [
                    { kbd: "=" },
                    " shows every file in one scroll, ",
                    { kbd: "|" },
                    " old and new side by side. Reviewed files collapse to their header.",
                ],
                media: {
                    src: "/media/layouts.webp",
                    alt: "All files mode with reviewed files collapsed",
                    ...drawerSize,
                },
            },
        ],
    },
    features: [
        {
            title: "Annotations that stay put",
            body: [
                "On lines, ranges or whole files. They follow their code and turn outdated when it is gone.",
            ],
        },
        {
            title: "Changed since reviewed",
            body: [
                "A reviewed file that changes again turns ↻, so the next pass shows only what moved.",
            ],
        },
        {
            title: "A prompt, not a plugin API",
            body: ["The hand-back is text on your clipboard. Any agent, any chat, any terminal."],
        },
        {
            title: "Per branch, across worktrees",
            body: [
                "Annotations and reviewed marks are saved per repository and branch. Linked worktrees share them.",
            ],
        },
        {
            title: "Open from the shell",
            body: [
                { mono: "nvim iter://review" },
                " goes straight to the review, or to the annotations.",
            ],
        },
        {
            title: "Your keys",
            body: ["Every key can be remapped or switched off. ", { kbd: "?" }, " lists them."],
        },
    ],
    install: {
        note: "Neovim 0.12+ · git on PATH · :checkhealth iter",
        methods: [
            {
                id: "pack",
                label: "vim.pack",
                lines: [
                    { text: "vim.pack.add({" },
                    { text: "  {" },
                    { text: "    src = 'https://github.com/black-atom-industries/iter.nvim'," },
                    { text: "    version = vim.version.range('*')," },
                    { text: "  }," },
                    { text: "})" },
                    { text: "require('iter').setup()" },
                ],
                note: "Run setup() at startup. iter does not lazy load.",
            },
            {
                id: "lazy",
                label: "lazy.nvim",
                lines: [
                    { text: "{" },
                    { text: "  'black-atom-industries/iter.nvim'," },
                    { text: "  lazy = false," },
                    { text: "  opts = {}," },
                    { text: "}" },
                ],
                note: "lazy = false: launching from the shell needs iter loaded at startup.",
            },
        ],
    },
} as const satisfies Product;
