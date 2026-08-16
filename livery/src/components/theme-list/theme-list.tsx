import { formatCollectionTitle, type ThemeGroup } from "../../lib/themes.ts";
import { ListRow } from "../primitives/list-row/list-row.tsx";
import { SectionHeader } from "../primitives/section-header/section-header.tsx";
import styles from "./theme-list.module.css";

interface ThemeListProps {
    groups: ThemeGroup[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

export function ThemeList({ groups, selectedIndex, onSelect }: ThemeListProps) {
    let flatIndex = 0;

    return (
        <div data-component="theme-list" className={styles.root}>
            {groups.map((group) => {
                const rows = group.themes.map((theme) => {
                    const index = flatIndex++;

                    const isSelected = index === selectedIndex;

                    return (
                        <ListRow
                            key={theme.meta.key}
                            selected={isSelected}
                            name={theme.meta.name}
                            pips={paletteAccentPips(theme.palette)}
                            appearance={theme.meta.appearance === "dark" ? "D" : "L"}
                            onClick={() => onSelect(index)}
                            rootRef={isSelected
                                ? (el) => el?.scrollIntoView({ block: "nearest" })
                                : undefined}
                        />
                    );
                });

                const label = `${
                    formatCollectionTitle(group.collectionKey, group.label)
                } (${group.themes.length})`;

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

function paletteAccentPips(
    palette: { red: string; yellow: string; green: string; magenta: string },
) {
    return [palette.red, palette.yellow, palette.green, palette.magenta];
}
