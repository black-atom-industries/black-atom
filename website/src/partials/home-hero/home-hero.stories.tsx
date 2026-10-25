import preview from "#/storybook/preview.tsx";
import { Button } from "#/components/button/index.ts";
import { HomeHero } from "./home-hero.tsx";

const meta = preview.meta({
    title: "Partials/HomeHero",
    component: HomeHero,
    parameters: { layout: "fullscreen" },
    args: {
        actions: (
            <>
                <Button variant="cta" render={<a href="#products" />}>
                    Products
                </Button>
                <Button render={<a href="#changelog" />}>Changelog</Button>
                <Button render={<a href="https://github.com/black-atom-industries" />}>
                    GitHub ↗
                </Button>
            </>
        ),
    },
});

export const Default = meta.story();
