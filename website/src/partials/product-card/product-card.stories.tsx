import preview from "#/storybook/preview.tsx";
import { ArtFrame } from "#/components/art-frame/index.ts";
import { Button } from "#/components/button/index.ts";
import { LoopArt } from "#/components/loop-art/index.ts";
import { iter } from "#/content/products/iter.ts";
import { home } from "#/content/studio.ts";
import { ProductCard } from "./product-card.tsx";

const meta = preview.meta({
    title: "Partials/ProductCard",
    component: ProductCard,
    args: {
        product: iter,
        release: { version: "v0.5.0", date: "2026-10-21" },
        links: (
            <>
                <Button variant="cta" render={<a href="#iter" />}>
                    {iter.name}
                </Button>
                <Button render={<a href={iter.repoUrl} />}>GitHub ↗</Button>
            </>
        ),
        art: (
            <ArtFrame label={home.art.loop.label}>
                <LoopArt stations={home.art.loop.stations} />
            </ArtFrame>
        ),
    },
});

export const Default = meta.story();
