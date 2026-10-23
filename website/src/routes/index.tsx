import { createFileRoute, Link } from "@tanstack/react-router";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { ArtFrame } from "#/components/art-frame/index.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { ColorStrip } from "#/components/color-strip/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { LoopArt } from "#/components/loop-art/index.ts";
import { RadarArt } from "#/components/radar-art/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { blackAtom } from "#/content/products/black-atom.ts";
import { iter } from "#/content/products/iter.ts";
import { products } from "#/content/products/products.ts";
import { radar } from "#/content/products/radar.ts";
import { changelogCopy, home, studio } from "#/content/studio.ts";
import { useTheme } from "#/hooks/use-theme.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";
import { ProductCard } from "#/partials/product-card/index.ts";
import { SectionHead } from "#/partials/section-head/index.ts";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [{ title: studio.name }, { name: "description", content: studio.description }],
    }),
    loader: ({ context }) => loadChangelog(context.queryClient, products),
    component: HomePage,
});

const paletteBands = [
    "var(--ba-c-red)",
    "var(--ba-c-yellow)",
    "var(--ba-c-green)",
    "var(--ba-c-cyan)",
    "var(--ba-c-blue)",
    "var(--ba-c-magenta)",
    "var(--ba-accent)",
    "var(--ba-fg)",
];

function HomePage() {
    const { theme } = useTheme();
    const changelog = useChangelog(products, { releasesPerProduct: 1, commits: 6 });

    return (
        <main>
            <Section variant="hero" id="top">
                <SceneAnchor variant="hole" />
                <Stack direction="row" gap="md" align="baseline">
                    <Caption tone="accent">00</Caption>
                    <Caption tone="subtle">{home.kicker}</Caption>
                </Stack>
                <Heading variant="display" subtitle="Industries">
                    Black Atom
                </Heading>
                <Rule />
                <Text variant="lead">{home.lead}</Text>
                <Stack direction="row" gap="xl" isWrapped>
                    <Button render={<a href="#products" />}>Products</Button>
                    <Button render={<Link to="/changelog" />}>Changelog</Button>
                    <Button render={<a href={studio.githubUrl} />}>GitHub ↗</Button>
                </Stack>
            </Section>
            <Section id="products">
                <SectionHead number="01" title="Products" />
                <Stack gap="2xl">
                    <ProductCard
                        product={blackAtom}
                        release={changelog.latest["black-atom"]}
                        links={
                            <>
                                <Button variant="cta" render={<Link to="/black-atom" />}>
                                    {blackAtom.name}
                                </Button>
                                <Button render={<Link to="/black-atom/livery" />}>Livery</Button>
                                <Button render={<Link to="/black-atom" hash="themes" />}>
                                    Browse themes
                                </Button>
                            </>
                        }
                        art={
                            <ArtFrame label={home.art.palette.label} caption={theme.meta.label}>
                                <ColorStrip colors={paletteBands} height="fill" />
                            </ArtFrame>
                        }
                    />
                    <ProductCard
                        product={iter}
                        release={changelog.latest.iter}
                        links={
                            <>
                                <Button variant="cta" render={<Link to="/iter" />}>
                                    {iter.name}
                                </Button>
                                <Button render={<a href={iter.repoUrl} />}>GitHub ↗</Button>
                            </>
                        }
                        art={
                            <ArtFrame label={home.art.loop.label}>
                                <LoopArt stations={home.art.loop.stations} />
                            </ArtFrame>
                        }
                    />
                    <ProductCard
                        product={radar}
                        release={changelog.latest.radar}
                        links={
                            <>
                                <Button variant="cta" render={<Link to="/radar" />}>
                                    {radar.name}
                                </Button>
                                <Button render={<a href={radar.repoUrl} />}>GitHub ↗</Button>
                            </>
                        }
                        art={
                            <ArtFrame label={home.art.radar.label}>
                                <RadarArt keyGroups={home.art.radar.keyGroups} />
                            </ArtFrame>
                        }
                    />
                </Stack>
            </Section>
            <Section id="latest">
                <SectionHead number="02" title="Latest" aside={changelogCopy.source} />
                <ChangelogBlock
                    releasesTitle="Releases"
                    releases={changelog.releases}
                    commitsTitle="Recent commits"
                    commits={changelog.commits}
                    empty={{ href: studio.githubUrl, failed: changelog.failed }}
                />
                <Stack direction="row" gap="xl">
                    <Button render={<Link to="/changelog" />}>All changes →</Button>
                </Stack>
            </Section>
        </main>
    );
}
