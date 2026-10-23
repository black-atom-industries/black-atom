export const studio = {
    name: "Black Atom Industries",
    tagline: "A personal development studio from Germany.",
    description:
        "Black Atom Industries is a personal development studio from Germany. It makes Black Atom, a theme system for every tool on your desktop, and the Neovim plugins iter.nvim and radar.nvim.",
    githubUrl: "https://github.com/black-atom-industries",
    copyright: "© 2026 Black Atom Industries",
    host: "black-atom.industries",
} as const;

export const home = {
    kicker: "A personal development studio from Germany",
    lead: "Tools for people who spend the day in a terminal and an editor. A theme system that colours every tool on your desktop the same way, and Neovim plugins for reviewing changes and moving between the files you work on.",
    /** The illustrations beside each product on the studio page. */
    art: {
        palette: { label: "The active theme's palette" },
        loop: {
            label: "iter: a review loop of read, stage, annotate, hand back",
            stations: ["Read", "Stage", "Annotate", "Hand back"],
        },
        radar: {
            label: "radar: a sweep over your working files, each one key away",
            keyGroups: [["a", "s", "d", "f", "g"], ["1", "2", "3"], ["o"]],
        },
    },
} as const;

export const about = {
    title: "About",
    kicker: "The studio",
    description:
        "About Black Atom Industries, a personal development studio from Germany that publishes its tools as open source.",
    lead: "Black Atom Industries is a personal development studio from Germany. It makes the tools its owner wants for a day spent in a terminal and an editor, and publishes them as open source.",
    paragraphs: [
        [{ placeholder: "[Who you are, in two or three sentences.]" }],
        [{ placeholder: "[Why the studio exists, and what connects the products.]" }],
    ],
    portrait: "[Portrait or workspace photo]",
    principles: [
        {
            title: "Written once",
            body: [
                "One definition, generated for every tool. The same idea runs through the themes and the plugins.",
            ],
        },
        {
            title: "Keyboard first",
            body: ["Everything has a key, and the keys sit where your hands already are."],
        },
        {
            title: "Readable output",
            body: [
                "Generated files are committed and readable, so you can check what you install.",
            ],
        },
    ],
    contact: [
        "Issues and ideas go to GitHub. ",
        { placeholder: "[Anything else: your contact address.]" },
    ],
} as const;

export const changelogCopy = {
    source: "Live from GitHub",
    empty: "Nothing to show here yet.",
    failed: "GitHub couldn't be reached right now.",
    elsewhere: "Every release and commit is on",
} as const;
