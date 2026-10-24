import { createFileRoute, Link } from "@tanstack/react-router";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { ColorStrip } from "#/components/color-strip/index.ts";
import { DataTable } from "#/components/data-table/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { InstallTabs } from "#/components/install-tabs/index.ts";
import { MediaFrame } from "#/components/media-frame/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Pager } from "#/components/pager/index.ts";
import { Panel } from "#/components/panel/index.ts";
import { Pill } from "#/components/pill/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Swatch } from "#/components/swatch/index.ts";
import { Text } from "#/components/text/index.ts";
import { ThemeCard } from "#/components/theme-card/index.ts";
import {
    adapters,
    blackAtom,
    blackAtomLinks,
    collectionBlurbs,
    collectionCount,
    switchedAdapters,
    themeCount,
    themesIntro,
    writtenOnce,
} from "#/content/products/black-atom.ts";
import { livery, liveryMainView } from "#/content/products/livery.ts";
import { changelogCopy, studio } from "#/content/studio.ts";
import { useTheme } from "#/hooks/use-theme.ts";
import { themeCollections } from "#/lib/theme-collections.ts";
import { toShortKey } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { ChangelogBlock } from "#/partials/changelog-block/index.ts";
import { SectionHead } from "#/partials/section-head/index.ts";

export const Route = createFileRoute("/black-atom/")({
    head: () => ({
        meta: [
            { title: `${blackAtom.name} · ${studio.name}` },
            { name: "description", content: blackAtom.description },
        ],
    }),
    loader: ({ context }) => loadChangelog(context.queryClient, changelogProducts),
    component: BlackAtomPage,
});

const rampColors = [
    "var(--ba-bg-panel)",
    "var(--ba-bg)",
    "var(--ba-bg-active)",
    "var(--ba-bg-selection)",
    "var(--ba-fg-disabled)",
    "var(--ba-fg-subtle)",
    "var(--ba-fg)",
    "var(--ba-accent)",
];

const changelogProducts = [blackAtom];

function BlackAtomPage() {
    const { theme, setTheme } = useTheme();
    const changelog = useChangelog(changelogProducts, { releasesPerProduct: 3, commits: 8 });

    return (
        <main>
            <Section variant="hero">
                <SceneAnchor variant="hole" />
                <Panel variant="backdrop" isFitted>
                    <Stack direction="row" gap="md" align="baseline">
                        <Caption tone="accent">{blackAtom.number}</Caption>
                        <Caption tone="subtle">{blackAtom.kicker}</Caption>
                    </Stack>
                    <Heading variant="display">{blackAtom.name}</Heading>
                    <Rule />
                    <Text variant="lead">
                        <RichText segments={blackAtom.lead} />
                    </Text>
                    <Stack direction="row" gap="xl" isWrapped>
                        <Button variant="cta" render={<a href="#themes" />}>
                            Browse themes
                        </Button>
                        <Button render={<Link to="/black-atom/livery" />}>Get Livery</Button>
                        <Button render={<a href="#tools" />}>{adapters.length} tools</Button>
                    </Stack>
                </Panel>
            </Section>

            <Section id="how">
                <SectionHead number="02" title={writtenOnce.title} />
                <Text variant="intro" tone="subtle">
                    {writtenOnce.intro}
                </Text>
                <PageGrid columns="three">
                    <Panel>
                        <Caption tone="subtle">{writtenOnce.definition.kicker}</Caption>
                        <Heading variant="item" render={<h3 />}>
                            {writtenOnce.definition.title}
                        </Heading>
                        <ColorStrip colors={rampColors} />
                        <Text variant="small" tone="subtle">
                            {writtenOnce.definition.body}
                        </Text>
                    </Panel>
                    <Panel>
                        <Caption tone="subtle">{writtenOnce.tokens.kicker}</Caption>
                        <Heading variant="item" render={<h3 />}>
                            {writtenOnce.tokens.title}
                        </Heading>
                        <Stack gap="xs" render={<ul />}>
                            {writtenOnce.tokens.items.map((token) => (
                                <Stack
                                    key={token.name}
                                    direction="row"
                                    gap="sm"
                                    align="center"
                                    render={<li />}
                                >
                                    <Swatch size="dot" color={token.color} />
                                    <Text variant="small" render={<span />}>
                                        <RichText segments={[{ mono: token.name }]} />
                                    </Text>
                                </Stack>
                            ))}
                        </Stack>
                    </Panel>
                    <Panel>
                        <Caption tone="subtle">{writtenOnce.tools.kicker}</Caption>
                        <Heading variant="item" render={<h3 />}>
                            {writtenOnce.tools.title}
                        </Heading>
                        <Stack direction="row" gap="xs" isWrapped>
                            {adapters.map((adapter) => (
                                <Pill key={adapter.id}>{adapter.id}</Pill>
                            ))}
                        </Stack>
                        <Text variant="small" tone="subtle">
                            {writtenOnce.tools.body}
                        </Text>
                    </Panel>
                </PageGrid>
            </Section>

            <Section id="themes">
                <SectionHead
                    number="03"
                    title="Themes"
                    aside={`${themeCount} themes · ${collectionCount} collections`}
                />
                <Text variant="intro" tone="subtle">
                    {themesIntro}
                </Text>
                <Stack gap="2xl">
                    {themeCollections.map((collection) => (
                        <Stack key={collection.key} gap="md">
                            <Stack direction="row" gap="md" align="baseline" isWrapped>
                                <Heading variant="title">{collection.label}</Heading>
                                <Text tone="subtle">{collectionBlurbs[collection.key]}</Text>
                            </Stack>
                            <PageGrid columns="cards">
                                {collection.themes.map((entry) => {
                                    const isWorn = entry.meta.key === theme.meta.key;
                                    const themeName = `${collection.label} ${entry.meta.name}`;
                                    return (
                                        <ThemeCard
                                            key={entry.meta.key}
                                            name={entry.meta.name}
                                            appearance={entry.meta.appearance}
                                            shortKey={toShortKey(entry.meta.key)}
                                            vars={themeToCustomProperties(entry)}
                                            isWorn={isWorn}
                                            actions={
                                                <>
                                                    <Button
                                                        variant="inline"
                                                        aria-pressed={isWorn}
                                                        aria-label={`${isWorn ? "Wearing" : "Wear"} ${themeName}`}
                                                        onClick={() => setTheme(entry.meta.key)}
                                                    >
                                                        {isWorn ? "Wearing" : "Wear"}
                                                    </Button>
                                                    <Button
                                                        variant="inline"
                                                        isSubtle
                                                        aria-label={`${themeName} docs`}
                                                        render={
                                                            <Link
                                                                to="/black-atom/themes/$theme"
                                                                params={{
                                                                    theme: toShortKey(
                                                                        entry.meta.key,
                                                                    ),
                                                                }}
                                                            />
                                                        }
                                                    >
                                                        Docs
                                                    </Button>
                                                </>
                                            }
                                        />
                                    );
                                })}
                            </PageGrid>
                        </Stack>
                    ))}
                </Stack>
            </Section>

            <Section id="tools">
                <SectionHead
                    number="04"
                    title="In your tools"
                    aside={`${adapters.length} adapters · Livery switches ${switchedAdapters.length}`}
                />
                <DataTable
                    label="Adapters"
                    columns={[
                        { label: "Tool", tone: "mono" },
                        { label: "Kind", tone: "subtle" },
                        { label: "By hand", tone: "subtle" },
                        { label: "Livery" },
                    ]}
                    rows={adapters.map((adapter) => ({
                        key: adapter.id,
                        cells: [
                            adapter.id,
                            adapter.kind,
                            adapter.manual,
                            <Pill key="livery" isActive={adapter.isSwitchedByLivery} hasDot>
                                {adapter.isSwitchedByLivery ? "switches" : "by hand"}
                            </Pill>,
                        ],
                    }))}
                />
                <Stack direction="row" gap="xl">
                    <Button render={<a href={blackAtomLinks.adapters} />}>Browse adapters ↗</Button>
                </Stack>
            </Section>

            <Section id="livery">
                <PageGrid columns="two" align="center">
                    <Stack gap="lg">
                        <SectionHead number={livery.number} title={livery.name} />
                        <Text variant="lead">
                            <RichText segments={livery.summary} />
                        </Text>
                        <Stack direction="row" gap="xl">
                            <Button variant="cta" render={<Link to="/black-atom/livery" />}>
                                {livery.name}
                            </Button>
                        </Stack>
                    </Stack>
                    <MediaFrame {...liveryMainView} />
                </PageGrid>
            </Section>

            <Section id="install">
                <SectionHead number="06" title="Install" />
                <InstallTabs
                    methods={blackAtom.install.methods}
                    label={`Ways to install ${blackAtom.name}`}
                    soonLabel="Soon"
                />
            </Section>

            <Section id="changes">
                <SectionHead number="07" title="Changelog" aside={changelogCopy.source} />
                <ChangelogBlock
                    releasesTitle="Releases"
                    releases={changelog.releases}
                    commitsTitle={`Recent commits · ${blackAtom.changelog.paths.join(" + ")}`}
                    commits={changelog.commits}
                    empty={{ href: blackAtom.repoUrl, failed: changelog.failed }}
                />
                <Stack direction="row" gap="xl">
                    <Button render={<Link to="/changelog" search={{ product: "black-atom" }} />}>
                        All changes →
                    </Button>
                </Stack>
            </Section>

            <Section variant="compact">
                <Pager
                    label="More pages"
                    previous={{ label: "← Studio", title: "Home", render: <Link to="/" /> }}
                    next={{
                        label: "Next →",
                        title: livery.name,
                        render: <Link to="/black-atom/livery" />,
                    }}
                />
            </Section>
        </main>
    );
}
