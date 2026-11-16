import { createFileRoute } from "@tanstack/react-router";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { ReadingColumn } from "#/components/reading-column/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { privacy } from "#/content/legal.ts";
import { studio } from "#/content/studio.ts";

export const Route = createFileRoute("/privacy")({
    head: () => ({
        meta: [
            { title: `${privacy.title} · ${studio.name}` },
            { name: "description", content: privacy.description },
        ],
    }),
    component: PrivacyPage,
});

function PrivacyPage() {
    return (
        <main>
            <Section variant="page">
                <ReadingColumn>
                    <Stack gap="md">
                        <Stack direction="row" gap="md" align="baseline">
                            <Caption tone="accent">··</Caption>
                            <Caption tone="subtle">Legal</Caption>
                        </Stack>
                        <Heading variant="display-sm">{privacy.title}</Heading>
                    </Stack>
                    {privacy.sections.map((section) => (
                        <Stack key={section.title} gap="sm" render={<section />}>
                            <Heading variant="title" render={<h2 />}>
                                {section.title}
                            </Heading>
                            <Text tone="subtle">
                                <RichText segments={section.body} />
                            </Text>
                        </Stack>
                    ))}
                </ReadingColumn>
            </Section>
        </main>
    );
}
