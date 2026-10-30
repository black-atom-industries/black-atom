import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { themeCatalog } from "@black-atom/core";
import { Breadcrumbs } from "#/components/breadcrumbs/index.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { ContrastScore } from "#/components/contrast-score/index.ts";
import { DataTable } from "#/components/data-table/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Pager } from "#/components/pager/index.ts";
import { contrastScore, readableRatio } from "#/lib/contrast-score.ts";
import { Pill } from "#/components/pill/index.ts";
import { RichText } from "#/components/rich-text/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Swatch } from "#/components/swatch/index.ts";
import { SwatchGrid } from "#/components/swatch-grid/index.ts";
import { Text } from "#/components/text/index.ts";
import { ThemePreview } from "#/components/theme-preview/index.ts";
import { ThemeScope } from "#/components/theme-scope/index.ts";
import { adapters, blackAtom, blackAtomLinks } from "#/content/products/black-atom.ts";
import { studio } from "#/content/studio.ts";
import { useTheme } from "#/hooks/use-theme.ts";
import { adapterFilePaths } from "#/lib/adapter-files.ts";
import { themeCollections } from "#/lib/theme-collections.ts";
import { fromShortKey, siblingThemeKey, stepThemeKey, toShortKey } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { SectionHead } from "#/partials/section-head/index.ts";
import { NotFoundPage, notFoundTitle } from "#/routes/-not-found-page.tsx";

export const Route = createFileRoute("/black-atom/themes/$theme")({
    loader: ({ params }) => {
        const themeKey = fromShortKey(params.theme);
        if (themeKey === undefined) throw notFound();
        return { themeKey };
    },
    head: ({ loaderData }) => {
        if (loaderData === undefined) return { meta: [{ title: notFoundTitle }] };
        const { meta } = themeCatalog[loaderData.themeKey];
        const title = `${meta.collection.label} ${meta.name}`;
        return {
            meta: [
                { title: `${title} · ${blackAtom.name} · ${studio.name}` },
                {
                    name: "description",
                    content: `${meta.label}: its colours, an editor and terminal preview, and the generated file for each of ${adapters.length} tools.`,
                },
            ],
        };
    },
    component: ThemePage,
    notFoundComponent: NotFoundPage,
});

function themeLink(themeKey: keyof typeof themeCatalog) {
    return <Link to="/black-atom/themes/$theme" params={{ theme: toShortKey(themeKey) }} />;
}

function ThemePage() {
    const { themeKey } = Route.useLoaderData();
    const { theme: worn, setTheme } = useTheme();
    const theme = themeCatalog[themeKey];
    const { meta } = theme;
    const shortKey = toShortKey(themeKey);
    const sibling = siblingThemeKey(themeKey);
    const previous = themeCatalog[stepThemeKey(themeKey, -1)].meta;
    const next = themeCatalog[stepThemeKey(themeKey, 1)].meta;
    const isWorn = worn.meta.key === themeKey;

    return (
        <main>
            <Section variant="page">
                <SceneAnchor variant="far-hole" />
                <Breadcrumbs
                    label="Breadcrumbs"
                    crumbs={[
                        { label: blackAtom.name, render: <Link to="/black-atom" /> },
                        { label: "Themes", render: <Link to="/black-atom" hash="themes" /> },
                        { label: meta.collection.label },
                    ]}
                />
                <Stack gap="sm" isDivided render={<nav aria-label="Themes" />}>
                    <Stack direction="row" gap="xs" isWrapped>
                        {themeCollections.map((entry) => (
                            <Button
                                key={entry.key}
                                variant="chip"
                                isActive={entry.key === meta.collection.key}
                                render={themeLink(entry.themes[0].meta.key)}
                            >
                                {entry.label}
                            </Button>
                        ))}
                    </Stack>
                    <Stack direction="row" gap="xs" isWrapped>
                        {Object.values(themeCatalog)
                            .filter((entry) => entry.meta.collection.key === meta.collection.key)
                            .map((entry) => (
                                <Button
                                    key={entry.meta.key}
                                    variant="chip"
                                    isActive={entry.meta.key === themeKey}
                                    render={themeLink(entry.meta.key)}
                                >
                                    {entry.meta.name}
                                </Button>
                            ))}
                    </Stack>
                </Stack>
                <Stack direction="row" justify="between" align="end" gap="lg" isWrapped>
                    <Heading
                        variant="name"
                        kicker={`${meta.collection.label} · ${meta.appearance}`}
                    >
                        {meta.name}
                    </Heading>
                    <Stack direction="row" gap="xs" isWrapped>
                        <Button
                            variant="cta"
                            aria-pressed={isWorn}
                            onClick={() => setTheme(themeKey)}
                        >
                            {isWorn ? "Wearing site-wide" : "Use site-wide"}
                        </Button>
                        {sibling !== undefined && (
                            <Button variant="chip" render={themeLink(sibling)}>
                                {themeCatalog[sibling].meta.name} →
                            </Button>
                        )}
                        <Button
                            variant="chip"
                            render={
                                <a href={`${blackAtomLinks.definitions}/${meta.collection.key}`} />
                            }
                        >
                            Definition ↗
                        </Button>
                    </Stack>
                </Stack>
                <Text variant="small" tone="subtle">
                    <RichText
                        segments={[
                            { mono: `${themeKey} · ${studio.host}/black-atom/themes/${shortKey}` },
                        ]}
                    />
                </Text>
                <ContrastScore {...contrastScore(theme)} ratio={readableRatio} />
                <ThemeScope vars={themeToCustomProperties(theme)}>
                    <ThemePreview
                        shortKey={shortKey}
                        name={meta.name}
                        palette={Object.values(theme.palette)}
                    />
                    <Stack gap="md">
                        <Caption tone="subtle">Primaries</Caption>
                        <SwatchGrid variant="ramp">
                            {Object.entries(theme.primaries).map(([key, color]) => (
                                <Swatch key={key} size="tile" color={color} label={key} />
                            ))}
                        </SwatchGrid>
                    </Stack>
                    <Stack gap="md">
                        <Caption tone="subtle">Accents · feedback</Caption>
                        <SwatchGrid>
                            {[
                                ...Object.entries(theme.accents),
                                ...Object.entries(theme.feedback),
                            ].map(([key, color]) => (
                                <Swatch
                                    key={key}
                                    size="tile"
                                    color={color}
                                    label={`${key} · ${color}`}
                                />
                            ))}
                        </SwatchGrid>
                    </Stack>
                    <Stack gap="md">
                        <Caption tone="subtle">Palette</Caption>
                        <SwatchGrid>
                            {Object.entries(theme.palette).map(([key, color]) => (
                                <Swatch
                                    key={key}
                                    size="tile"
                                    color={color}
                                    label={`${key} · ${color}`}
                                />
                            ))}
                        </SwatchGrid>
                    </Stack>
                </ThemeScope>
            </Section>
            <Section id="files">
                <SectionHead number="··" title="Files" aside={`Generated for ${meta.name}`} />
                <DataTable
                    label={`Files generated for ${meta.label}`}
                    columns={[
                        { label: "Tool", tone: "mono" },
                        { label: "File", tone: "mono" },
                        { label: "Livery" },
                    ]}
                    rows={adapters.map((adapter) => ({
                        key: adapter.id,
                        cells: [
                            adapter.id,
                            <Stack key="files" gap="2xs">
                                {adapterFilePaths({
                                    adapterId: adapter.id,
                                    extensions: adapter.extensions,
                                    theme: meta,
                                }).map((path) => (
                                    <Text key={path} variant="small" render={<span />}>
                                        <a href={`${blackAtomLinks.files}${path}`}>{path}</a>
                                    </Text>
                                ))}
                            </Stack>,
                            <Pill key="livery" isActive={adapter.isSwitchedByLivery} hasDot>
                                {adapter.isSwitchedByLivery ? "switches" : "by hand"}
                            </Pill>,
                        ],
                    }))}
                />
            </Section>
            <Section variant="compact">
                <Pager
                    label="Other themes"
                    previous={{
                        label: "← Previous",
                        title: `${previous.collection.label} ${previous.name}`,
                        render: themeLink(previous.key),
                    }}
                    next={{
                        label: "Next →",
                        title: `${next.collection.label} ${next.name}`,
                        render: themeLink(next.key),
                    }}
                />
            </Section>
        </main>
    );
}
