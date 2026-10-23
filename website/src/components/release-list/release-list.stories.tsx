import preview from "#/storybook/preview.tsx";
import { ReleaseList } from "./release-list.tsx";

const meta = preview.meta({
    title: "Components/ReleaseList",
    component: ReleaseList,
    args: {
        title: "Releases",
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
    },
});

export const Default = meta.story();

export const WithProducts = meta.story({
    args: {
        releases: [
            {
                product: "radar.nvim",
                version: "v0.8.0",
                date: "2026-10-18",
                highlights: [["Locks sit on the home row"]],
            },
            {
                product: "Black Atom",
                version: "v0.11.0",
                date: "2026-10-15",
                highlights: [["Livery switches herdr"], ["Four new terra themes"]],
            },
        ],
    },
});
