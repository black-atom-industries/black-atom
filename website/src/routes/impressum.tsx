import { createFileRoute } from "@tanstack/react-router";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { ReadingColumn } from "#/components/reading-column/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { impressum } from "#/content/legal.ts";
import { studio } from "#/content/studio.ts";

export const Route = createFileRoute("/impressum")({
    head: () => ({
        meta: [
            { title: `${impressum.title} · ${studio.name}` },
            { name: "description", content: impressum.description },
        ],
    }),
    component: ImpressumPage,
});

function ImpressumPage() {
    return (
        <main>
            <Section variant="page">
                <ReadingColumn>
                    <Stack gap="md">
                        <Stack direction="row" gap="md" align="baseline">
                            <Caption tone="accent">··</Caption>
                            <Caption tone="subtle">Legal</Caption>
                        </Stack>
                        <Heading variant="display-sm">{impressum.title}</Heading>
                    </Stack>
                    {impressum.sections.map((section) => (
                        <Stack key={section.title} gap="sm" render={<section />}>
                            <Heading variant="title" render={<h2 />}>
                                {section.title}
                            </Heading>
                            <Text render={<address />}>
                                {section.address.map((line, index) => (
                                    <span key={index}>
                                        <RichText segments={line} />
                                        <br />
                                    </span>
                                ))}
                            </Text>
                            {section.entries.map((entry) => (
                                <Stack key={entry.title} gap="xs">
                                    <Heading variant="item" render={<h3 />}>
                                        {entry.title}
                                    </Heading>
                                    <Text tone="subtle">
                                        <RichText segments={entry.body} />
                                    </Text>
                                </Stack>
                            ))}
                        </Stack>
                    ))}
                </ReadingColumn>
            </Section>
        </main>
    );
}
