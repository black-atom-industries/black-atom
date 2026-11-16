import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { products } from "#/content/products/products.ts";
import { productKeys, type Product } from "#/content/products/types.ts";
import { studio } from "#/content/studio.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";

const changelogSearchSchema = z.object({
    product: z.enum(productKeys).optional().catch(undefined),
});

const filters = [
    { key: undefined, label: "All" },
    ...products.map((product) => ({
        key: product.key,
        label: product.name,
    })),
];

function productsFor(key: Product["key"] | undefined): readonly Product[] {
    return key === undefined ? products : products.filter((product) => product.key === key);
}

export const Route = createFileRoute("/changelog")({
    validateSearch: changelogSearchSchema,
    loaderDeps: ({ search }) => ({ product: search.product }),
    loader: ({ context, deps }) => loadChangelog(context.queryClient, productsFor(deps.product)),
    head: () => ({
        meta: [
            { title: `Changelog · ${studio.name}` },
            {
                name: "description",
                content:
                    "Releases and commits across every Black Atom Industries product, read live from GitHub.",
            },
        ],
    }),
    component: ChangelogPage,
});

function ChangelogPage() {
    const { product } = Route.useSearch();
    const shownProducts = useMemo(() => productsFor(product), [product]);
    const changelog = useChangelog(shownProducts, { releasesPerProduct: 10, commits: 12 });
    const source = shownProducts.length === 1 ? shownProducts[0]?.repoUrl : undefined;

    return (
        <main>
            <Section variant="page">
                <Stack direction="row" gap="md" align="baseline">
                    <Caption tone="accent">··</Caption>
                    <Caption tone="subtle">Everything that shipped</Caption>
                </Stack>
                <Heading variant="display-sm">Changelog</Heading>
                <Text variant="lead" tone="subtle">
                    Releases and commits across every product, read live from GitHub. Release
                    highlights first, raw commits beside them.
                </Text>
                <Stack
                    direction="row"
                    justify="between"
                    align="center"
                    gap="md"
                    isWrapped
                    isDivided
                >
                    <Stack
                        direction="row"
                        gap="xs"
                        isWrapped
                        render={<nav aria-label="Filter by product" />}
                    >
                        {filters.map((filter) => (
                            <Button
                                key={filter.label}
                                variant="chip"
                                isActive={filter.key === product}
                                render={
                                    <Link
                                        to="/changelog"
                                        search={(prev) => ({ ...prev, product: filter.key })}
                                        activeOptions={{ includeSearch: true }}
                                    />
                                }
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </Stack>
                    <Text variant="small" tone="subtle">
                        <RichText
                            segments={[
                                {
                                    mono: `${studio.host}/changelog${product === undefined ? "" : `?product=${product}`}`,
                                },
                            ]}
                        />
                    </Text>
                </Stack>
                <ChangelogBlock
                    releasesTitle="Releases"
                    releases={changelog.releases}
                    commitsTitle="Recent commits"
                    commits={changelog.commits}
                    empty={{ href: source ?? studio.githubUrl, failed: changelog.failed }}
                    headingLevel={2}
                />
            </Section>
        </main>
    );
}
