import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as Theme from "@black-atom/core";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { type ChangedToken, changedTokens } from "#/lib/theme-diff.ts";
import { themesAt } from "./get-themes-at.ts";
import styles from "./theme-compare.module.css";

const shownChanges = 8;

function isTheme(value: unknown): value is Theme.Definition {
    return typeof value === "object" && value !== null && "ui" in value && "syntax" in value;
}

/** The theme under `key` in a revision's catalog; undefined when the revision lacks it. */
function themeAt(catalog: unknown, key: string): Theme.Definition | undefined {
    if (typeof catalog !== "object" || catalog === null) return undefined;
    const entry = Object.entries(catalog).find(([name]) => name === key);
    return entry !== undefined && isTheme(entry[1]) ? entry[1] : undefined;
}

type Search = { base?: string; compare?: boolean };

function useSetSearch() {
    const navigate = useNavigate({ from: "/black-atom/themes/$theme" });
    return (next: Search) => {
        void navigate({
            to: ".",
            search: (prev) => ({ ...prev, ...next }),
            replace: true,
            resetScroll: false,
        });
    };
}

function ChangeValue({ color }: { color: string }) {
    return (
        <>
            <span className={styles.swatch} style={{ background: color }} aria-hidden />
            <span>{color}</span>
        </>
    );
}

function Change({ change }: { change: ChangedToken }) {
    return (
        <li className={styles.change}>
            <span className={styles.path}>{change.path}</span>
            {change.before === undefined ? (
                <Caption tone="subtle">new</Caption>
            ) : (
                <ChangeValue color={change.before} />
            )}
            <Caption tone="subtle">→</Caption>
            <ChangeValue color={change.after} />
        </li>
    );
}

function ChangeList({ changes }: { changes: ChangedToken[] }) {
    if (changes.length === 0) return <Text tone="subtle">no changes</Text>;
    const hidden = changes.length - shownChanges;
    return (
        <ul className={styles.changes}>
            {changes.slice(0, shownChanges).map((change) => (
                <Change key={change.path} change={change} />
            ))}
            {hidden > 0 && <li>{`+${hidden} more`}</li>}
        </ul>
    );
}

/** The base revision field. Keyed by the applied revision, so the draft follows the URL. */
function BaseRevision({ base }: { base: string }) {
    const setSearch = useSetSearch();
    const [draft, setDraft] = useState(base);

    function apply() {
        const next = draft.trim();
        if (next === base) return;
        setSearch({ base: next === "" || next === "HEAD" ? undefined : next });
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        apply();
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <label>
                <Caption tone="subtle">Base revision</Caption>
                <input
                    className={styles.input}
                    value={draft}
                    placeholder="HEAD"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    onBlur={apply}
                />
            </label>
        </form>
    );
}

type Props = {
    themeKey: Theme.Key;
    theme: Theme.Definition;
    base: string;
    compare: boolean;
    /** Receives the theme at the base revision when it is compared, and the revision's name. */
    children: (before: Theme.Definition | undefined, revision: string) => ReactNode;
};

/** Dev only. A strip with the base revision, the changed tokens and the side-by-side switch, then the previews. */
export function ThemeCompare({ themeKey, theme, base, compare, children }: Props) {
    const setSearch = useSetSearch();
    const query = useQuery(themesAt(base));
    const before = query.data === undefined ? undefined : themeAt(query.data, themeKey);
    const changes = before === undefined ? [] : changedTokens(before, theme);

    return (
        <Stack gap="xl">
            <div className={styles.strip}>
                <span className={styles.tag}>Dev</span>
                <Caption tone="subtle">Dev server only</Caption>
                <BaseRevision key={base} base={base} />
                {query.isError && (
                    <Text tone="subtle">{`Could not load the theme at ${base}.`}</Text>
                )}
                {query.isSuccess && before === undefined && (
                    <Text tone="subtle">{`${themeKey} is not in ${base}.`}</Text>
                )}
                {before !== undefined && <ChangeList changes={changes} />}
                <Button
                    variant="chip"
                    aria-pressed={compare}
                    onClick={() => setSearch({ compare: compare ? false : undefined })}
                >
                    {compare ? "Side by side · on" : "Side by side · off"}
                </Button>
            </div>
            {children(compare ? before : undefined, base)}
        </Stack>
    );
}
