import { createFileRoute } from "@tanstack/react-router";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { FeatureGrid } from "#/components/feature-grid/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { PlaceholderSlot } from "#/components/placeholder-slot/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { about, studio } from "#/content/studio.ts";
import { SectionHead } from "#/partials/section-head/index.ts";

export const Route = createFileRoute("/about")({
    head: () => ({
        meta: [
            { title: `${about.title} · ${studio.name}` },
            { name: "description", content: about.description },
        ],
    }),
    component: AboutPage,
});

function AboutPage() {
    return (
        <main>
            <Section variant="page">
                <PageGrid columns="two" align="start">
                    <Stack gap="lg">
                        <Stack direction="row" gap="md" align="baseline">
                            <Caption tone="accent">··</Caption>
                            <Caption tone="subtle">{about.kicker}</Caption>
                        </Stack>
                        <Heading variant="display-sm">{about.title}</Heading>
                        <Rule />
                        <Text variant="lead">{about.lead}</Text>
                        {about.paragraphs.map((paragraph, index) => (
                            <Text key={index} variant="lead" tone="subtle">
                                <RichText segments={paragraph} />
                            </Text>
                        ))}
                        <Stack direction="row" gap="xl" isWrapped>
                            <Button render={<a href={studio.githubUrl} />}>GitHub ↗</Button>
                            <Button render={<a href="#contact" />}>Contact</Button>
                        </Stack>
                    </Stack>
                    <PlaceholderSlot label={about.portrait} />
                </PageGrid>
            </Section>
            <Section id="principles">
                <SectionHead number="01" title="Principles" />
                <FeatureGrid
                    features={about.principles.map((principle) => ({
                        title: principle.title,
                        body: <RichText segments={principle.body} />,
                    }))}
                />
            </Section>
            <Section id="contact">
                <SectionHead number="02" title="Contact" />
                <Text variant="lead" tone="subtle">
                    <RichText segments={about.contact} />
                </Text>
            </Section>
        </main>
    );
}
