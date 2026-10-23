import { createFileRoute, Link } from "@tanstack/react-router";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { AppIcon } from "#/components/app-icon/index.ts";
import { Breadcrumbs } from "#/components/breadcrumbs/index.ts";
import { Button } from "#/components/button/index.ts";
import { CodeBlock } from "#/components/code-block/index.ts";
import { CommandList } from "#/components/command-list/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { InstallTabs } from "#/components/install-tabs/index.ts";
import { MediaFrame } from "#/components/media-frame/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Pager } from "#/components/pager/index.ts";
import { Pill } from "#/components/pill/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { StepList } from "#/components/step-list/index.ts";
import { Text } from "#/components/text/index.ts";
import { blackAtom, manualAdapters, switchedAdapters } from "#/content/products/black-atom.ts";
import { iter } from "#/content/products/iter.ts";
import {
    livery,
    liveryCommands,
    liveryIcon,
    liveryManualNote,
    liveryScreens,
} from "#/content/products/livery.ts";
import { studio } from "#/content/studio.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";
import { SectionHead } from "#/partials/section-head/index.ts";

export const Route = createFileRoute("/black-atom/livery")({
    head: () => ({
        meta: [
            { title: `${livery.name} · ${blackAtom.name} · ${studio.name}` },
            { name: "description", content: livery.description },
        ],
    }),
    loader: ({ context }) => loadChangelog(context.queryClient, changelogProducts),
    component: LiveryPage,
});

const changelogProducts = [livery];

function LiveryPage() {
    const changelog = useChangelog(changelogProducts, { releasesPerProduct: 3, commits: 8 });

    return (
        <main>
            <Section variant="hero">
                <SceneAnchor variant="hole" />
                <AppIcon src={liveryIcon.src} alt="" />
                <Breadcrumbs
                    label="Breadcrumbs"
                    crumbs={[
                        { label: blackAtom.name, render: <Link to="/black-atom" /> },
                        { label: livery.kicker },
                    ]}
                />
                <Heading variant="display">{livery.name}</Heading>
                <Rule />
                <Text variant="lead">
                    <RichText segments={livery.lead} />
                </Text>
                <Stack direction="row" gap="xl" isWrapped>
                    <Button variant="cta" render={<a href="#install" />}>
                        Install
                    </Button>
                    <Button render={<a href="#cli" />}>The livery command</Button>
                    <Button render={<a href="#tools" />}>Supported tools</Button>
                </Stack>
            </Section>

            <Section id={livery.steps.id}>
                <SectionHead number="01" title={livery.steps.title} />
                <StepList
                    steps={livery.steps.items.map((step) => ({
                        title: step.title,
                        body: <RichText segments={step.body} />,
                    }))}
                />
            </Section>

            <Section id="screens">
                <SectionHead number="02" title="The app" />
                <PageGrid columns="three">
                    {liveryScreens.map((screen) => (
                        <MediaFrame key={screen.src} {...screen} />
                    ))}
                </PageGrid>
            </Section>

            <Section id="cli">
                <PageGrid columns="two">
                    <Stack gap="lg">
                        <SectionHead number="03" title={liveryCommands.title} />
                        <Text tone="subtle">
                            <RichText segments={liveryCommands.intro} />
                        </Text>
                        <CodeBlock lines={liveryCommands.example} />
                    </Stack>
                    <CommandList commands={liveryCommands.commands} />
                </PageGrid>
            </Section>

            <Section id="tools">
                <PageGrid columns="two">
                    <Stack gap="md">
                        <SectionHead number="04" title="Switched by Livery" />
                        <Stack direction="row" gap="xs" isWrapped>
                            {switchedAdapters.map((adapter) => (
                                <Pill key={adapter.id} isActive hasDot>
                                    {adapter.id}
                                </Pill>
                            ))}
                        </Stack>
                    </Stack>
                    <Stack gap="md">
                        <SectionHead number="··" title="By hand, for now" />
                        <Stack direction="row" gap="xs" isWrapped>
                            {manualAdapters.map((adapter) => (
                                <Pill key={adapter.id}>{adapter.id}</Pill>
                            ))}
                        </Stack>
                        <Text variant="small" tone="subtle">
                            {liveryManualNote}
                        </Text>
                    </Stack>
                </PageGrid>
            </Section>

            <Section id="install">
                <SectionHead number="05" title="Install" />
                <InstallTabs
                    methods={livery.install.methods}
                    label={`Ways to install ${livery.name}`}
                    soonLabel="Soon"
                />
            </Section>

            <Section id="changes">
                <SectionHead
                    number="06"
                    title="Changelog"
                    aside="Shared release stream with the themes"
                />
                <ChangelogBlock
                    releasesTitle="Releases"
                    releases={changelog.releases}
                    commitsTitle={`Recent commits · ${livery.changelog.paths.join(" + ")}`}
                    commits={changelog.commits}
                    empty={{ href: livery.repoUrl, failed: changelog.failed }}
                />
            </Section>

            <Section variant="compact">
                <Pager
                    label="More pages"
                    previous={{
                        label: "← Back",
                        title: blackAtom.name,
                        render: <Link to="/black-atom" />,
                    }}
                    next={{ label: "Next →", title: iter.name, render: <Link to="/iter" /> }}
                />
            </Section>
        </main>
    );
}
