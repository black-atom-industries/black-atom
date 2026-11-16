import type { ReactNode } from "react";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import type { Commit } from "#/components/commit-list/index.ts";
import { Demo } from "#/components/demo/index.ts";
import { FeatureGrid } from "#/components/feature-grid/index.ts";
import { InstallTabs } from "#/components/install-tabs/index.ts";
import { Kbd } from "#/components/kbd/index.ts";
import { MediaFrame } from "#/components/media-frame/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Pager, type PagerLink } from "#/components/pager/index.ts";
import { Panel } from "#/components/panel/index.ts";
import type { Release } from "#/components/release-list/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { StepList } from "#/components/step-list/index.ts";
import { Text } from "#/components/text/index.ts";
import type { Product } from "#/content/products/types.ts";
import { changelogCopy } from "#/content/studio.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";
import { ProductHero } from "#/partials/product-hero/index.ts";
import { SectionHead } from "#/partials/section-head/index.ts";

type Props = {
    product: Product;
    /** The illustration beside the hero text. */
    art: ReactNode;
    /** Shown under the keymap panel. */
    keymapAside?: ReactNode;
    pager: { previous: PagerLink; next: PagerLink };
    /** The latest release, read from GitHub. */
    release?: { version: string; date?: string };
    changelog: {
        releases: readonly Release[];
        commits: readonly Commit[];
        empty: { href: string; failed: { releases: boolean; commits: boolean } };
    };
};

/** The page of a Neovim plugin: hero, how it works, clips, details, install and changelog. */
export function ProductPage({ product, art, keymapAside, pager, release, changelog }: Props) {
    const { steps, keymap, demos, features } = product;

    const stepList = steps !== undefined && (
        <Stack gap="2xl">
            <SectionHead number="01" title={steps.title} />
            <StepList
                steps={steps.items.map((step) => ({
                    title: step.title,
                    body: <RichText segments={step.body} />,
                }))}
            />
        </Stack>
    );

    return (
        <main data-partial="ProductPage">
            <ProductHero
                number={product.number}
                kicker={product.kicker}
                title={product.name}
                tagline={product.tagline ?? ""}
                lead={<RichText segments={product.lead} />}
                meta={[
                    ...(release === undefined ? [] : [{ label: release.version, isStrong: true }]),
                    ...product.facts.map((label) => ({ label })),
                ]}
                actions={
                    <>
                        <Button variant="cta" render={<a href="#install" />}>
                            Install
                        </Button>
                        {steps !== undefined && (
                            <Button render={<a href={`#${steps.id}`} />}>{steps.title}</Button>
                        )}
                        <Button render={<a href={product.repoUrl} />}>GitHub ↗</Button>
                    </>
                }
                art={art}
            />
            {steps !== undefined && (
                <Section id={steps.id}>
                    {keymap === undefined ? (
                        stepList
                    ) : (
                        <PageGrid columns="two" align="start">
                            {stepList}
                            <Stack gap="lg">
                                <Panel>
                                    <Caption tone="subtle">{keymap.title}</Caption>
                                    {keymap.rows.map((row) => (
                                        <Stack
                                            key={row.label}
                                            direction="row"
                                            gap="xs"
                                            align="center"
                                            isWrapped
                                        >
                                            {row.keys.map((key) => (
                                                <Kbd key={key}>{key}</Kbd>
                                            ))}
                                            <Text variant="small" tone="subtle">
                                                {row.label}
                                            </Text>
                                        </Stack>
                                    ))}
                                    <Text variant="small" tone="subtle">
                                        {keymap.note}
                                    </Text>
                                </Panel>
                                {keymapAside}
                            </Stack>
                        </PageGrid>
                    )}
                </Section>
            )}
            {demos !== undefined && (
                <Section id="demos">
                    <SectionHead number="02" title="See it" />
                    {demos.layout === "rows" ? (
                        <Stack gap="2xl">
                            {demos.items.map((demo) => (
                                <Demo
                                    key={demo.title}
                                    kicker={demo.kicker}
                                    title={demo.title}
                                    body={<RichText segments={demo.body} />}
                                    media={<MediaFrame {...demo.media} />}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <PageGrid columns="two">
                            {demos.items.map((demo) => (
                                <Demo
                                    key={demo.title}
                                    layout="stacked"
                                    kicker={demo.kicker}
                                    title={demo.title}
                                    body={<RichText segments={demo.body} />}
                                    media={<MediaFrame {...demo.media} />}
                                />
                            ))}
                        </PageGrid>
                    )}
                </Section>
            )}
            {features !== undefined && (
                <Section id="features">
                    <SectionHead number="03" title="Details" />
                    <FeatureGrid
                        features={features.map((feature) => ({
                            title: feature.title,
                            body: <RichText segments={feature.body} />,
                        }))}
                    />
                </Section>
            )}
            <Section id="install">
                <SectionHead number="04" title="Install" aside={product.install.note} />
                <InstallTabs
                    methods={product.install.methods}
                    label={`Ways to install ${product.name}`}
                    soonLabel="Soon"
                />
            </Section>
            <Section id="changes">
                <SectionHead number="05" title="Changelog" aside={changelogCopy.source} />
                <ChangelogBlock
                    releasesTitle="Releases"
                    releases={changelog.releases}
                    commitsTitle="Recent commits"
                    commits={changelog.commits}
                    empty={changelog.empty}
                />
            </Section>
            <Section variant="compact">
                <Pager label="More pages" previous={pager.previous} next={pager.next} />
            </Section>
        </main>
    );
}
