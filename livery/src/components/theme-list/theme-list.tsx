import { formatCollectionTitle, type ThemeGroup } from "../../lib/themes.ts";
import type * as Theme from "@black-atom/core";
import { Badge } from "../primitives/badge/badge.tsx";
import { ListRow } from "../primitives/list-row/list-row.tsx";
import { SectionHeader } from "../primitives/section-header/section-header.tsx";
import styles from "./theme-list.module.css";

interface ThemeListProps {
    groups: ThemeGroup[];
    selectedIndex: number;
    /** Key of the theme livery last applied, or null for no marker. */
    activeThemeKey?: string | null;
    onSelect: (index: number) => void;
}

export function ThemeList({ groups, selectedIndex, activeThemeKey, onSelect }: ThemeListProps) {
    let flatIndex = 0;

    return (
        <div data-component="theme-list" className={styles.root}>
            {groups.map((group) => {
                const rows = group.themes.map((theme) => {
                    const index = flatIndex++;

                    const isSelected = index === selectedIndex;
                    const isActive = theme.meta.key === activeThemeKey;

                    return (
                        <ListRow
                            key={theme.meta.key}
                            selected={isSelected}
                            name={theme.meta.name}
                            pips={themePips(theme)}
                            appearance={theme.meta.appearance === "dark" ? "D" : "L"}
                            leading={isActive ? <Badge size="mini">ACTIVE</Badge> : null}
                            onClick={() => onSelect(index)}
                            rootRef={
                                isSelected
                                    ? (el) => el?.scrollIntoView({ block: "nearest" })
                                    : undefined
                            }
                        />
                    );
                });

                const label = `${formatCollectionTitle(
                    group.collectionKey,
                    group.label,
                )} (${group.themes.length})`;

                return (
                    <div key={group.collectionKey} className={styles.group}>
                        <div className={styles.sectionHeader}>
                            <SectionHeader>{label}</SectionHeader>
                        </div>
                        {rows}
                    </div>
                );
            })}
        </div>
    );
}

const PIP_COUNT = 10;

function themePips(theme: Theme.Definition) {
    const { accents, palette } = theme;
    const candidates = [
        accents.a10,
        accents.a20,
        accents.a30,
        accents.a40,
        palette.red,
        palette.green,
        palette.blue,
        palette.yellow,
        palette.magenta,
        palette.cyan,
    ];

    const colors = new Set([theme.ui.bg.default]);

    for (const color of candidates) {
        if (colors.size === PIP_COUNT) break;
        if (color) colors.add(color);
    }

    return [...colors];
}
