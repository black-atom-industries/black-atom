import { lazy, Suspense } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { themeCatalog } from "@black-atom/core";
import { z } from "zod";
import { Breadcrumbs } from "#/components/breadcrumbs/index.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { ContrastLegend } from "#/components/contrast-legend/index.ts";
import { DataTable } from "#/components/data-table/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Pager } from "#/components/pager/index.ts";
import { Pill } from "#/components/pill/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { SpecPlate } from "#/components/spec-plate/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Swatch } from "#/components/swatch/index.ts";
import { SwatchGrid } from "#/components/swatch-grid/index.ts";
import { SwatchPair } from "#/components/swatch-pair/index.ts";
import { Text } from "#/components/text/index.ts";
import { adapters, blackAtom, blackAtomLinks } from "#/content/products/black-atom.ts";
import { studio } from "#/content/studio.ts";
import { useTheme } from "#/hooks/use-theme.ts";
import { adapterFilePaths } from "#/lib/adapter-files.ts";
import { tallyContrast, themeContrastRatios } from "#/lib/contrast-summary.ts";
import { familyVariant, groupThemeFamilies, themeFamilyName } from "#/lib/theme-families.ts";
import { themeCollections } from "#/lib/theme-collections.ts";
import { fromShortKey, siblingThemeKey, stepThemeKey, toShortKey } from "#/lib/theme-precedence.ts";
import { SectionHead } from "#/partials/section-head/index.ts";
import { type ThemeChip, ThemePicker } from "#/partials/theme-picker/index.ts";
import { ThemePreviews } from "#/partials/theme-previews/index.ts";
import {
    SyntaxTokens,
    TerminalTokens,
    UiBackgroundTokens,
    UiForegroundTokens,
} from "#/partials/theme-tokens/index.ts";
import { NotFoundPage, notFoundTitle } from "#/routes/-not-found-page.tsx";

/** Read in dev only; the production page ignores both params. */
const themeSearchSchema = z.object({
    base: z.string().optional().catch(undefined),
    compare: z.boolean().optional().catch(undefined),
});

/** Dev only: the comparison strip and the before previews. Production renders the previews alone. */
const ThemeCompare = import.meta.env.DEV
    ? lazy(() =>
          import("#/dev/theme-compare/theme-compare.tsx").then((module) => ({
              default: module.ThemeCompare,
          })),
      )
    : null;

export const Route = createFileRoute("/black-atom/themes/$theme")({
    validateSearch: themeSearchSchema,
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

const ansiPairs = [
    ["black", "gray"],
    ["darkRed", "red"],
    ["darkGreen", "green"],
    ["darkYellow", "yellow"],
    ["darkBlue", "blue"],
    ["darkMagenta", "magenta"],
    ["darkCyan", "cyan"],
    ["lightGray", "white"],
] as const;

const sections = [
    { href: "#previews", label: "Previews" },
    { href: "#primaries", label: "Primaries" },
    { href: "#palette", label: "Palette" },
    { href: "#accents", label: "Accents" },
    { href: "#feedback", label: "Feedback" },
    { href: "#ui-backgrounds", label: "UI backgrounds" },
    { href: "#ui-foregrounds", label: "UI foregrounds" },
    { href: "#syntax", label: "Syntax" },
    { href: "#terminal", label: "Terminal" },
    { href: "#files", label: "Files" },
];

function themeLink(themeKey: keyof typeof themeCatalog) {
    return <Link to="/black-atom/themes/$theme" params={{ theme: toShortKey(themeKey) }} />;
}

function presentEntries(entries: [string, string | undefined][]): [string, string][] {
    return entries.filter((entry): entry is [string, string] => entry[1] !== undefined);
}

function ThemePage() {
    const { themeKey } = Route.useLoaderData();
    const search = Route.useSearch();
    const { theme: worn, setTheme } = useTheme();
    const theme = themeCatalog[themeKey];
    const { meta } = theme;
    const shortKey = toShortKey(themeKey);
    const sibling = siblingThemeKey(themeKey);
    const previous = themeCatalog[stepThemeKey(themeKey, -1)].meta;
    const next = themeCatalog[stepThemeKey(themeKey, 1)].meta;
    const isWorn = worn.meta.key === themeKey;

    const collectionThemes = Object.values(themeCatalog).filter(
        (entry) => entry.meta.collection.key === meta.collection.key,
    );
    const collectionChips: ThemeChip[] = themeCollections.map((entry) => ({
        key: entry.key,
        label: entry.label,
        theme: entry.themes[0],
        isActive: entry.key === meta.collection.key,
        render: themeLink(entry.themes[0].meta.key),
    }));
    const familyChips: ThemeChip[] = groupThemeFamilies(collectionThemes).map((family) => {
        const variant = familyVariant(family, meta.appearance);
        return {
            key: family.name,
            label: family.name,
            theme: variant,
            isActive: family.name === themeFamilyName(meta.name, meta.collection.label),
            render: themeLink(variant.meta.key),
        };
    });

    const otherAppearance = meta.appearance === "dark" ? "light" : "dark";
    const appearanceOptions = (["dark", "light"] as const).map((appearance) => {
        const target = appearance === meta.appearance ? themeKey : sibling;
        return {
            label: appearance,
            isActive: appearance === meta.appearance,
            theme: target === undefined ? undefined : themeCatalog[target],
            render: target === undefined ? undefined : themeLink(target),
        };
    });
    const contrast = tallyContrast(themeContrastRatios(theme));
    const readablePercent = Math.round(contrast.readableShare * 100);
    const { counts } = contrast;
    const strip = [
        ...Object.values(theme.primaries),
        ...Object.values(theme.accents).filter((color) => color !== undefined),
    ];

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
                <ThemePicker
                    collections={collectionChips}
                    families={familyChips}
                    appearances={appearanceOptions}
                />
                <Stack direction="row" justify="between" align="end" gap="lg" isWrapped>
                    <Stack gap="2xs">
                        <Caption tone="subtle">{`${meta.collection.label} · ${meta.appearance}`}</Caption>
                        <Heading variant="name">{meta.name}</Heading>
                    </Stack>
                    <Stack direction="row" gap="xs" isWrapped>
                        <Button
                            variant="cta"
                            aria-pressed={isWorn}
                            onClick={() => setTheme(themeKey)}
                        >
                            {isWorn ? "Wearing site-wide" : "Use site-wide"}
                        </Button>
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
                <SpecPlate
                    strip={strip}
                    cells={[
                        {
                            label: "Collection",
                            value: meta.collection.label,
                            note: `${collectionThemes.length} themes`,
                        },
                        {
                            label: "Appearance",
                            value: meta.appearance,
                            note:
                                sibling === undefined
                                    ? `${meta.appearance} only`
                                    : `also in ${otherAppearance}`,
                        },
                        { label: "Status", value: meta.status, note: "in the catalog" },
                        {
                            label: "Contrast",
                            value: `${readablePercent}%`,
                            note: `${counts.aaa} AAA · ${counts.aa} AA · ${counts.large} large · ${counts.low} low`,
                            tone: readablePercent === 100 ? "good" : "fair",
                        },
                        { label: "Accent", value: theme.accents.a10, note: "a10", tone: "accent" },
                    ]}
                    keyLine={`${themeKey} · ${studio.host}/black-atom/themes/${shortKey}`}
                />
                <Stack
                    direction="row"
                    gap="xs"
                    isWrapped
                    render={<nav aria-label="On this page" />}
                >
                    {sections.map((item) => (
                        <Button key={item.href} variant="chip" render={<a href={item.href} />}>
                            {item.label}
                        </Button>
                    ))}
                </Stack>
            </Section>
            <Section variant="wide" id="previews">
                {ThemeCompare === null ? (
                    <ThemePreviews theme={theme} />
                ) : (
                    <Suspense fallback={<ThemePreviews theme={theme} />}>
                        <ThemeCompare
                            themeKey={themeKey}
                            theme={theme}
                            base={search.base ?? "HEAD"}
                            compare={search.compare ?? true}
                        >
                            {(before, revision) => (
                                <ThemePreviews
                                    theme={theme}
                                    before={before}
                                    beforeLabel={`Before · ${revision}`}
                                />
                            )}
                        </ThemeCompare>
                    </Suspense>
                )}
            </Section>
            <Section>
                <Stack gap="md">
                    <Heading variant="section" id="primaries">
                        Primaries
                    </Heading>
                    <SwatchGrid variant="ramp">
                        {Object.entries(theme.primaries).map(([key, color]) => (
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
                    <Heading variant="section" id="palette">
                        Palette
                    </Heading>
                    <PageGrid columns="cards">
                        {ansiPairs.map(([first, second]) => (
                            <SwatchPair
                                key={first}
                                first={{ label: first, color: theme.palette[first] }}
                                second={{ label: second, color: theme.palette[second] }}
                            />
                        ))}
                    </PageGrid>
                </Stack>
                <Stack gap="md">
                    <Heading variant="section" id="accents">
                        Accents
                    </Heading>
                    <SwatchGrid>
                        {presentEntries(Object.entries(theme.accents)).map(([key, color]) => (
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
                    <Heading variant="section" id="feedback">
                        Feedback
                    </Heading>
                    <SwatchGrid>
                        {Object.entries(theme.feedback).map(([key, color]) => (
                            <Swatch
                                key={key}
                                size="tile"
                                color={color}
                                label={`${key} · ${color}`}
                            />
                        ))}
                    </SwatchGrid>
                </Stack>
                <Stack gap="sm">
                    <Caption tone="subtle">Contrast grades</Caption>
                    <ContrastLegend />
                </Stack>
                <Stack gap="md">
                    <Heading variant="section" id="ui-backgrounds">
                        UI backgrounds
                    </Heading>
                    <UiBackgroundTokens theme={theme} />
                </Stack>
                <Stack gap="md">
                    <Heading variant="section" id="ui-foregrounds">
                        UI foregrounds
                    </Heading>
                    <UiForegroundTokens theme={theme} />
                </Stack>
                <Stack gap="md">
                    <Heading variant="section" id="syntax">
                        Syntax
                    </Heading>
                    <Text variant="small" tone="subtle">
                        Comments are dim on purpose, so they sit lower than the rest of the code.
                    </Text>
                    <SyntaxTokens theme={theme} />
                </Stack>
                <Stack gap="md">
                    <Heading variant="section" id="terminal">
                        Terminal
                    </Heading>
                    <Text variant="small" tone="subtle">
                        Gray is the terminal&apos;s dim text, the counterpart of comments.
                    </Text>
                    <TerminalTokens theme={theme} />
                </Stack>
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
