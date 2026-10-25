import type { ReactNode } from "react";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { MetaList, type MetaItem } from "#/components/meta-list/index.ts";
import { Panel } from "#/components/panel/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";

type Props = {
    number: string;
    kicker: string;
    title: string;
    tagline: string;
    lead: ReactNode;
    meta: readonly MetaItem[];
    /** Buttons and links under the text. */
    actions: ReactNode;
    /** The scene anchor the background frames at the top right. */
    art: ReactNode;
};

export function ProductHero({ number, kicker, title, tagline, lead, meta, actions, art }: Props) {
    return (
        <Section variant="hero" data-partial="ProductHero">
            {art}
            <Panel variant="hero" isFitted>
                <Stack gap="lg">
                    <Stack direction="row" gap="md" align="baseline">
                        <Caption tone="accent">{number}</Caption>
                        <Caption tone="subtle">{kicker}</Caption>
                    </Stack>
                    <Heading variant="display-sm">{title}</Heading>
                    <Text variant="tagline">{tagline}</Text>
                    <Text variant="lead">{lead}</Text>
                    <MetaList items={meta} />
                    <Stack direction="row" gap="xl" isWrapped>
                        {actions}
                    </Stack>
                </Stack>
            </Panel>
        </Section>
    );
}
