import preview from "#/storybook/preview.tsx";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { Section } from "./section.tsx";

const meta = preview.meta({
    title: "Layout/Section",
    component: Section,
    parameters: { layout: "fullscreen" },
    args: {
        children: (
            <>
                <Stack direction="row" gap="md" align="baseline" isWrapped>
                    <Caption tone="accent">01</Caption>
                    <Heading>The loop</Heading>
                </Stack>
                <Text tone="subtle">Read the diff, stage what is ready, annotate what is not.</Text>
            </>
        ),
    },
});

export const Default = meta.story();

export const Compact = meta.story({ args: { variant: "compact" } });
