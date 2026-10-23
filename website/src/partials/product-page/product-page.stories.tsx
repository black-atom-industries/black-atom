import preview from "#/storybook/preview.tsx";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { iter } from "#/content/products/iter.ts";
import { radar } from "#/content/products/radar.ts";
import { ProductPage } from "./product-page.tsx";

const meta = preview.meta({
    title: "Partials/ProductPage",
    component: ProductPage,
    parameters: { layout: "fullscreen" },
    args: {
        product: iter,
        art: <SceneAnchor variant="wide" label={iter.artLabel} />,
        pager: {
            previous: { label: "← Back", title: "Livery", render: <a href="#livery" /> },
            next: { label: "Next →", title: "radar.nvim", render: <a href="#radar" /> },
        },
        changelog: {
            releases: [],
            commits: [],
            emptyText: "Nothing to show yet. Releases and commits are on GitHub.",
        },
    },
});

export const Iter = meta.story();

export const Radar = meta.story({
    args: {
        product: radar,
        art: <SceneAnchor variant="square" label={radar.artLabel} />,
    },
});
