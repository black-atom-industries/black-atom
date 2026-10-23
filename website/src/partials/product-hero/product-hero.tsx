import type { ReactNode } from "react";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { MetaList, type MetaItem } from "#/components/meta-list/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";

type Props = {
    number: string;
    kicker: string;
    title: string;
    tagline: string;
    lead: string;
    meta: readonly MetaItem[];
    /** Buttons and links under the text. */
    actions: ReactNode;
    /** The illustration beside the text. */
    art: ReactNode;
};

export function ProductHero({ number, kicker, title, tagline, lead, meta, actions, art }: Props) {
    return (
        <Section variant="product" data-partial="ProductHero">
            <PageGrid columns="two" align="center">
                <Stack gap="lg">
                    <Stack direction="row" gap="md" align="baseline">
                        <Caption tone="accent">{number}</Caption>
                        <Caption tone="subtle">{kicker}</Caption>
                    </Stack>
                    <Heading variant="display-sm">{title}</Heading>
                    <Rule />
                    <Text variant="tagline">{tagline}</Text>
                    <Text variant="lead" tone="subtle">
                        {lead}
                    </Text>
                    <MetaList items={meta} />
                    <Stack direction="row" gap="xl" isWrapped>
                        {actions}
                    </Stack>
                </Stack>
                {art}
            </PageGrid>
        </Section>
    );
}
