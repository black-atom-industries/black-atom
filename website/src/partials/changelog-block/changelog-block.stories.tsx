import preview from "#/storybook/preview.tsx";
import { ChangelogBlock } from "./changelog-block.tsx";

const meta = preview.meta({
    title: "Partials/ChangelogBlock",
    component: ChangelogBlock,
    args: {
        releasesTitle: "Releases",
        releases: [
            {
                version: "v0.8.0",
                date: "2026-10-18",
                highlights: [
                    ["Locks sit on the home row"],
                    ["Important fixes"],
                    ["Upgrading from 0.7"],
                ],
            },
            {
                version: "v0.7.2",
                date: "2026-09-30",
                highlights: [["Lock slots survive a restart"]],
            },
        ],
        commitsTitle: "Recent commits",
        commits: [
            {
                sha: "35ac047",
                message: "fix(locks): warn when all lock slots are in use",
                date: "10-18",
            },
            { sha: "9b1e2d0", message: "feat(locks): put locks on the home row", date: "10-16" },
            { sha: "4c7aa31", message: "docs: describe the upgrade from 0.7", date: "10-15" },
        ],
    },
});

export const Default = meta.story();

export const Empty = meta.story({
    args: {
        releases: [],
        commits: [],
        emptyText: "Nothing to show yet. Releases and commits are on GitHub.",
    },
});
