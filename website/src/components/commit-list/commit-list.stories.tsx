import preview from "#/storybook/preview.tsx";
import { CommitList } from "./commit-list.tsx";

const meta = preview.meta({
    title: "Components/CommitList",
    component: CommitList,
    args: {
        title: "Recent commits",
        commits: [
            {
                sha: "35ac047",
                message: "fix(locks): warn when all lock slots are in use",
                date: "10-18",
            },
            { sha: "9b1e2d0", message: "feat(locks): put locks on the home row", date: "10-16" },
            {
                sha: "4c7aa31",
                message: "docs: describe the upgrade from 0.7",
                date: "10-15",
                href: "https://github.com/black-atom-industries/radar.nvim/commit/4c7aa31",
            },
        ],
    },
});

export const Default = meta.story();
