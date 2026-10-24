import preview from "#/storybook/preview.tsx";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Text } from "#/components/text/index.ts";
import { Panel } from "./panel.tsx";

const meta = preview.meta({
    title: "Components/Panel",
    component: Panel,
    args: {
        children: (
            <>
                <Caption tone="subtle">1 · Definition</Caption>
                <Heading variant="item">Primaries and accents</Heading>
                <Text variant="small" tone="subtle">
                    Twelve steps from dark to light, plus up to four accents.
                </Text>
            </>
        ),
    },
});

export const Default = meta.story();

export const Backdrop = meta.story({ args: { variant: "backdrop" } });
