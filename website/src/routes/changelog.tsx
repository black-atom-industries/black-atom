import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { blackAtom } from "#/content/products/black-atom.ts";
import { iter } from "#/content/products/iter.ts";
import { livery } from "#/content/products/livery.ts";
import { radar } from "#/content/products/radar.ts";
import { productKeys } from "#/content/products/types.ts";
import { studio } from "#/content/studio.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";
import { pendingChangelog } from "#/routes/-changelog-seam.ts";

const changelogSearchSchema = z.object({
    product: z.enum(productKeys).optional().catch(undefined),
});

const filters = [
    { key: undefined, label: "All" },
    ...[blackAtom, livery, iter, radar].map((product) => ({
        key: product.key,
        label: product.name,
    })),
];

export const Route = createFileRoute("/changelog")({
    validateSearch: changelogSearchSchema,
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

    return (
        <main>
            <Section variant="page">
                <SceneAnchor variant="far-hole" />
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
                    releases={pendingChangelog.releases}
                    commitsTitle="Recent commits"
                    commits={pendingChangelog.commits}
                    emptyText={pendingChangelog.emptyText}
                    headingLevel={2}
                />
            </Section>
        </main>
    );
}
