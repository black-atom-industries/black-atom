import preview from "#/storybook/preview.tsx";
import { Button } from "#/components/button/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { ProductHero } from "./product-hero.tsx";

const meta = preview.meta({
    title: "Partials/ProductHero",
    component: ProductHero,
    parameters: { layout: "fullscreen" },
    args: {
        number: "02",
        kicker: "Neovim plugin",
        title: "iter.nvim",
        tagline: "Review, annotate, hand back, repeat.",
        lead: "Whether the changes are yours or an agent's, iter is the review half of the loop. Read the diff, stage what is ready, annotate what is not, and hand the annotations back as a prompt.",
        meta: [
            { label: "v0.5.0", isStrong: true },
            { label: "Neovim 0.12+" },
            { label: "git" },
            { label: "MIT" },
        ],
        actions: (
            <>
                <Button variant="cta" render={<a href="#install" />}>
                    Install
                </Button>
                <Button render={<a href="#loop" />}>The loop</Button>
                <Button render={<a href="https://github.com/black-atom-industries/iter.nvim" />}>
                    GitHub ↗
                </Button>
            </>
        ),
        art: (
            <SceneAnchor
                variant="wide"
                label="Changes flow into a review loop and come back out as a prompt"
            />
        ),
    },
});

export const Default = meta.story();
