import type { ReactNode } from "react";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { MetaList } from "#/components/meta-list/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Panel } from "#/components/panel/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import type { Product } from "#/content/products/types.ts";

type Props = {
    product: Product;
    /** Buttons and links under the pitch. */
    links: ReactNode;
    /** The illustration beside the pitch. */
    art: ReactNode;
};

/** A product on the studio page: its pitch, latest release and links, beside its illustration. */
export function ProductCard({ product, links, art }: Props) {
    return (
        <PageGrid columns="two" render={<article />} data-partial="ProductCard">
            <Panel>
                <Stack direction="row" gap="sm" align="baseline">
                    <Caption tone="accent">{product.number}</Caption>
                    <Caption tone="subtle">{product.kicker}</Caption>
                </Stack>
                <Heading variant="product">{product.name}</Heading>
                {product.tagline !== undefined && <Text variant="tagline">{product.tagline}</Text>}
                <Text tone="subtle">
                    <RichText segments={product.summary} />
                </Text>
                <MetaList
                    items={[
                        ...(product.release === undefined
                            ? []
                            : [
                                  { label: product.release.version, isStrong: true },
                                  { label: product.release.date },
                              ]),
                        { label: product.platform },
                    ]}
                />
                <Stack direction="row" gap="xl" isWrapped>
                    {links}
                </Stack>
            </Panel>
            {art}
        </PageGrid>
    );
}
