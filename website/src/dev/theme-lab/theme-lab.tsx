import { useState, type SyntheticEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { collectionOrder, themeCatalog, themeKeys } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Choice } from "#/components/choice/index.ts";
import { DataTable } from "#/components/data-table/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Panel } from "#/components/panel/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { toShortKey } from "#/lib/theme-precedence.ts";
import { themesAt } from "./get-themes-at.ts";
import { themeLabSearch } from "./theme-lab-search.ts";
import { contrastPairs, ThemePanel } from "./theme-panel.tsx";
import styles from "./theme-lab.module.css";

function isCatalog(value: unknown): value is Record<string, Theme.Definition> {
    return typeof value === "object" && value !== null;
}

function isTheme(value: unknown): value is Theme.Definition {
    return typeof value === "object" && value !== null && "ui" in value && "syntax" in value;
}

function lowCount(theme: Theme.Definition) {
    return [...contrastPairs(theme).values()].filter((pair) => pair.ratio < 3).length;
}

function lowSummary(old: Theme.Definition | undefined, after: Theme.Definition) {
    return `${old ? lowCount(old) : "–"} → ${lowCount(after)}`;
}

/** Themes grouped by collection, in the collection order of core. */
const collectionGroups = collectionOrder.flatMap((collection) => {
    const members = themeKeys.filter((key) => themeCatalog[key].meta.collection.key === collection);
    const first = members.at(0);
    if (first === undefined) return [];
    return [{ key: collection, label: themeCatalog[first].meta.collection.label, members }];
});

/**
 * Sets or clears one search param on the current URL, client side. The dev route is added in code,
 * so the typed router cannot name its search schema; the other params, the hash and the root
 * `theme` param carry over unchanged.
 */
function useSetSearchParam() {
    const router = useRouter();
    return (name: "key" | "base", value: string | undefined) => {
        const url = new URL(router.history.location.href, "http://localhost");
        if (value === undefined) url.searchParams.delete(name);
        else url.searchParams.set(name, value);
        router.history.push(`${url.pathname}${url.search}${url.hash}`);
    };
}

function BaseRevision({ base }: { base: string | undefined }) {
    const setSearchParam = useSetSearchParam();
    const [draft, setDraft] = useState(base ?? "");

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setSearchParam("base", draft.trim() || undefined);
    }

    return (
        <form className={styles.baseForm} onSubmit={handleSubmit}>
            <label className={styles.field}>
                <Caption tone="subtle">Base revision</Caption>
                <input
                    className={styles.input}
                    value={draft}
                    placeholder="HEAD"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                />
            </label>
            <Button variant="chip" type="submit">
                Compare
            </Button>
        </form>
    );
}

/** Every theme as a mock editor, next to the same theme at a git revision. */
export function ThemeLab() {
    const search = themeLabSearch.parse(useSearch({ strict: false }));
    const setSearchParam = useSetSearchParam();
    const revision = search.base ?? "HEAD";
    const base = useQuery(themesAt(revision));
    const before = isCatalog(base.data) ? base.data : {};
    const keys = search.key ? themeKeys.filter((key) => key === search.key) : themeKeys;

    return (
        <main>
            <Section variant="page">
                <Stack gap="xl">
                    <Stack gap="sm">
                        <Caption tone="subtle">Development</Caption>
                        <Heading variant="display-sm">Theme lab</Heading>
                        <Text variant="intro" tone="subtle">
                            Each theme as a mock editor: before at the base revision, after in the
                            working tree. Contrast ratios are WCAG. Red marks a pair under 3:1, the
                            minimum for UI components and large text.
                        </Text>
                    </Stack>

                    <Stack gap="md">
                        <Stack direction="row" gap="sm" align="center" isWrapped>
                            <Caption tone="subtle">Theme</Caption>
                            <Choice
                                isSelected={!search.key}
                                onClick={() => setSearchParam("key", undefined)}
                            >
                                All
                            </Choice>
                        </Stack>
                        {collectionGroups.map((group) => (
                            <Stack key={group.key} gap="sm">
                                <Caption tone="subtle">{group.label}</Caption>
                                <Stack direction="row" gap="sm" isWrapped>
                                    {group.members.map((key) => (
                                        <Choice
                                            key={key}
                                            isSelected={search.key === key}
                                            onClick={() => setSearchParam("key", key)}
                                        >
                                            {themeCatalog[key].meta.name}
                                        </Choice>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}
                        <BaseRevision base={search.base} />
                    </Stack>

                    <Rule />

                    <Stack gap="md">
                        <Heading variant="title" render={<h2 />}>
                            Overview
                        </Heading>
                        {base.isError && (
                            <Text tone="subtle">Could not load the themes at {revision}.</Text>
                        )}
                        <DataTable
                            label="Pairs under 3:1 per theme"
                            columns={[
                                { label: "Theme" },
                                { label: "Under 3:1, before → after", tone: "mono" },
                            ]}
                            rows={keys.map((key) => {
                                const previous = before[key];
                                const old = isTheme(previous) ? previous : undefined;
                                return {
                                    key,
                                    cells: [
                                        <a href={`#${key}`}>{themeCatalog[key].meta.label}</a>,
                                        lowSummary(old, themeCatalog[key]),
                                    ],
                                };
                            })}
                        />
                    </Stack>
                </Stack>
            </Section>

            <div className={styles.wide}>
                <Panel variant="backdrop">
                    {keys.map((key) => {
                        const after = themeCatalog[key];
                        const previous = before[key];
                        const old = isTheme(previous) ? previous : undefined;
                        return (
                            <section key={key} id={key} className={styles.theme}>
                                <Stack gap="md">
                                    <Stack direction="row" gap="md" align="baseline" isWrapped>
                                        <Heading variant="title" render={<h2 />}>
                                            {after.meta.label}
                                        </Heading>
                                        <Caption tone="subtle">
                                            {after.meta.collection.label} · {after.meta.appearance}{" "}
                                            · under 3:1 {lowSummary(old, after)}
                                        </Caption>
                                        <Button
                                            variant="link"
                                            render={
                                                <Link
                                                    to="/black-atom/themes/$theme"
                                                    params={{ theme: toShortKey(key) }}
                                                    search={{ theme: toShortKey(key) }}
                                                />
                                            }
                                        >
                                            Theme page →
                                        </Button>
                                    </Stack>
                                    <div className={styles.pair}>
                                        {old ? (
                                            <ThemePanel
                                                theme={old}
                                                label={`before · ${revision}`}
                                            />
                                        ) : (
                                            <div />
                                        )}
                                        <ThemePanel theme={after} label="after · working tree" />
                                    </div>
                                </Stack>
                            </section>
                        );
                    })}
                </Panel>
            </div>
        </main>
    );
}
