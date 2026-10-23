import preview from "#/storybook/preview.tsx";
import { SiteFooter } from "./site-footer.tsx";

const meta = preview.meta({
    title: "Partials/SiteFooter",
    component: SiteFooter,
    parameters: { layout: "fullscreen" },
    args: {
        columns: [
            {
                title: "Black Atom",
                links: [
                    { label: "Overview", render: <a href="#black-atom" /> },
                    { label: "Themes", render: <a href="#themes" /> },
                    { label: "Livery", render: <a href="#livery" /> },
                    {
                        label: "Adapters ↗",
                        render: (
                            <a href="https://github.com/black-atom-industries/black-atom/tree/main/adapters" />
                        ),
                    },
                ],
            },
            {
                title: "Neovim",
                links: [
                    { label: "iter.nvim", render: <a href="#iter" /> },
                    { label: "radar.nvim", render: <a href="#radar" /> },
                ],
            },
            {
                title: "Studio",
                links: [
                    { label: "About", render: <a href="#about" /> },
                    { label: "Changelog", render: <a href="#changelog" /> },
                    {
                        label: "GitHub ↗",
                        render: <a href="https://github.com/black-atom-industries" />,
                    },
                ],
            },
        ],
        about: {
            title: "Black Atom Industries",
            text: "A personal development studio from Germany.",
        },
        copyright: "© 2026 Black Atom Industries · MIT",
        legalLabel: "Legal",
        legalLinks: [
            { label: "Impressum", render: <a href="#impressum" /> },
            { label: "Privacy", render: <a href="#privacy" /> },
        ],
    },
});

export const Default = meta.story();
