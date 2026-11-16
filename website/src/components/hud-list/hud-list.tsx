import { cva } from "cva";
import styles from "./hud-list.module.css";

const entryVariants = cva({
    base: styles.entry,
    variants: {
        isCurrent: { false: null, true: styles.current },
        isRecent: { false: null, true: styles.recent },
    },
});

export type HudEntry = {
    key: string;
    file: string;
    isCurrent?: boolean;
    isRecent?: boolean;
};

/** radar's Lock HUD as text: groups of files, each behind its key. */
export function HudList({ groups }: { groups: readonly (readonly HudEntry[])[] }) {
    return (
        <div data-component="HudList" className={styles.root}>
            {groups.map((group) => (
                <ul key={group[0]?.key} className={styles.group}>
                    {group.map((entry) => (
                        <li
                            key={entry.key}
                            className={entryVariants({
                                isCurrent: entry.isCurrent ?? false,
                                isRecent: entry.isRecent ?? false,
                            })}
                        >
                            <b>{entry.key}</b>
                            <span>{entry.file}</span>
                        </li>
                    ))}
                </ul>
            ))}
        </div>
    );
}
