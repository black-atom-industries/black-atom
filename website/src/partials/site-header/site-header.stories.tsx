import preview from "#/storybook/preview.tsx";
import { SiteHeader } from "./site-header.tsx";

const meta = preview.meta({
    title: "Partials/SiteHeader",
    component: SiteHeader,
    parameters: {
        layout: "fullscreen",
        // Fixed positioning needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "200px" } },
    },
    args: {
        brand: { title: "Black Atom", subtitle: "Industries", render: <a href="#home" /> },
        navLabel: "Main",
        items: [
            { label: "Black Atom", number: "01", render: <a href="#black-atom" /> },
            {
                label: "iter.nvim",
                number: "02",
                render: <a href="#iter" aria-current="page" />,
            },
            { label: "radar.nvim", number: "03", render: <a href="#radar" /> },
            { label: "Changelog", isSecondary: true, render: <a href="#changelog" /> },
            { label: "About", isSecondary: true, render: <a href="#about" /> },
        ],
    },
    render: (args) => (
        <div style={{ minHeight: 140 }}>
            <SiteHeader {...args} />
        </div>
    ),
});

export const Default = meta.story();
