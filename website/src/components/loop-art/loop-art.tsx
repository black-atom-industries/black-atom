import styles from "./loop-art.module.css";

type Props = {
    /** The four stations around the ring, clockwise from the top. */
    stations: readonly [string, string, string, string];
};

/** iter's review loop: a ring with a turning arc and the loop's four stations. */
export function LoopArt({ stations }: Props) {
    const [top, right, bottom, left] = stations;
    return (
        <svg
            data-component="LoopArt"
            className={styles.root}
            viewBox="0 0 300 300"
            aria-hidden="true"
        >
            <g className={styles.rings}>
                <circle cx="150" cy="150" r="118" opacity=".35" />
                <circle cx="150" cy="150" r="88" opacity=".55" />
                <circle cx="150" cy="150" r="58" opacity=".35" />
            </g>
            <g className={styles.arc}>
                <path d="M150 32 A118 118 0 0 1 268 150" />
                <circle cx="268" cy="150" r="6" />
            </g>
            <text className={styles.mark} x="150" y="160" textAnchor="middle">
                ↻
            </text>
            <g className={styles.stations}>
                <text x="150" y="20" textAnchor="middle">
                    {top}
                </text>
                <text x="290" y="154" textAnchor="end">
                    {right}
                </text>
                <text x="150" y="292" textAnchor="middle">
                    {bottom}
                </text>
                <text x="10" y="154">
                    {left}
                </text>
            </g>
        </svg>
    );
}
