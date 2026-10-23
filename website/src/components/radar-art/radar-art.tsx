import { cva } from "cva";
import styles from "./radar-art.module.css";

const keyVariants = cva({
    base: styles.key,
    variants: {
        isLit: { false: null, true: styles.lit },
    },
});

type Props = {
    /** Key groups under the scope; the first key of the first group blinks. */
    keyGroups: readonly (readonly string[])[];
};

/** radar's sweep over the working files, with the keys that reach them. */
export function RadarArt({ keyGroups }: Props) {
    return (
        <div data-component="RadarArt" className={styles.root}>
            <svg className={styles.scope} viewBox="0 0 240 240" aria-hidden="true">
                <g className={styles.rings}>
                    <circle cx="120" cy="120" r="40" />
                    <circle cx="120" cy="120" r="78" />
                    <circle cx="120" cy="120" r="114" />
                    <path d="M120 6V234M6 120H234" opacity=".6" />
                </g>
                <path className={styles.sweep} d="M120 120 L120 6 A114 114 0 0 1 200 39 Z" />
                <g className={styles.locks}>
                    <circle cx="160" cy="70" r="4" />
                    <circle cx="84" cy="96" r="4" />
                </g>
                <g className={styles.recent}>
                    <circle cx="150" cy="168" r="3.5" />
                    <circle cx="70" cy="160" r="3.5" />
                    <circle cx="178" cy="122" r="3.5" />
                </g>
            </svg>
            <div aria-hidden="true" className={styles.keys}>
                {keyGroups.map((group, groupIndex) => (
                    <span key={group.join("")} className={styles.group}>
                        {group.map((key, keyIndex) => (
                            <kbd
                                key={key}
                                className={keyVariants({
                                    isLit: groupIndex === 0 && keyIndex === 0,
                                })}
                            >
                                {key}
                            </kbd>
                        ))}
                    </span>
                ))}
            </div>
        </div>
    );
}
