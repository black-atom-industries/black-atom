import { cva } from "cva";
import type { BackgroundState } from "#/lib/route-background-state.ts";
import styles from "./background-fallback.module.css";

const figureVariants = cva({
    base: styles.figure,
    variants: {
        view: {
            hole: styles.hole,
            iter: styles.iter,
            radar: styles.radar,
            wide: styles.wide,
        },
        isReceded: { true: styles.receded, false: "" },
    },
});

const TAU = Math.PI * 2;

function Hole() {
    return (
        <g>
            <ellipse className={styles.accent} rx="78" ry="15" transform="rotate(-10)" />
            <ellipse className={styles.faint} rx="58" ry="10" transform="rotate(-10)" />
            <circle className={styles.line} r="22" />
            <circle className={styles.faint} r="30" />
            <circle className={styles.faint} r="44" />
            <path className={styles.faint} d="M-96 -70 C -40 -46, -10 -30, -24 -2" />
            <path className={styles.faint} d="M-90 60 C -50 34, -30 22, -20 12" />
            <path className={styles.faint} d="M96 -50 C 60 -30, 36 -24, 24 -10" />
        </g>
    );
}

function Iter() {
    const strands = [-26, -12, 0, 14, 28];
    return (
        <g>
            <circle className={styles.faint} r="22" />
            <circle className={styles.line} r="40" />
            <circle className={styles.faint} r="60" />
            <path className={styles.accent} d="M0 -40 A 40 40 0 0 1 40 0" />
            {strands.map((offset) => (
                <path
                    key={offset}
                    className={styles.faint}
                    d={`M-98 ${offset * 1.6} C -70 ${offset}, -60 ${offset * 0.5}, -40 ${offset * 0.3}`}
                />
            ))}
            <path className={styles.line} d="M28 28 C 46 46, 60 60, 96 92" />
            <path className={styles.faint} d="M24 32 C 44 52, 62 58, 92 96" />
        </g>
    );
}

function Radar() {
    const rings = [10, 20, 30, 40, 50, 60, 70];
    const ticks = Array.from({ length: 36 }, (_, k) => (k / 36) * TAU);
    const blips: [number, number][] = [
        [0.6, 22],
        [2.1, 34],
        [3.4, 18],
        [4.6, 44],
        [5.5, 28],
    ];
    return (
        <g>
            {rings.map((r) => (
                <circle key={r} className={styles.faint} r={r} />
            ))}
            <path className={styles.faint} d="M-76 0 H76 M0 -76 V76" />
            {ticks.map((angle, k) => {
                const inner = k % 6 === 0 ? 36 : 39;
                return (
                    <path
                        key={angle}
                        className={styles.faint}
                        d={`M${Math.cos(angle) * inner} ${Math.sin(angle) * inner} L${Math.cos(angle) * 42} ${Math.sin(angle) * 42}`}
                    />
                );
            })}
            <path className={styles.beam} d="M0 0 L72 0 A 72 72 0 0 0 52.6 -49.2 Z" />
            <path className={styles.accent} d="M0 0 L72 0" />
            {blips.map(([angle, r]) => (
                <circle
                    key={angle}
                    className={styles.line}
                    r="3"
                    cx={Math.cos(angle) * r}
                    cy={Math.sin(angle) * r}
                />
            ))}
        </g>
    );
}

function Wide() {
    return (
        <g>
            <g transform="translate(-32 -34) scale(0.42)">
                <Hole />
            </g>
            <g transform="translate(44 4) scale(0.3)">
                <Iter />
            </g>
            <g transform="translate(-6 44) scale(0.32)">
                <Radar />
            </g>
        </g>
    );
}

const drawings = { hole: Hole, iter: Iter, radar: Radar, wide: Wide };

type Props = {
    /** The landmark the page is about, or the wide shot of all three. */
    view: BackgroundState["view"];
    isReceded?: boolean;
};

/**
 * A still, theme-coloured outline of the page's landmark, for browsers without 3D graphics. It sits
 * where the 3D shot frames the landmark and is decorative only.
 */
export function BackgroundFallback({ view, isReceded = false }: Props) {
    const Drawing = drawings[view];
    return (
        <div data-component="BackgroundFallback" className={styles.root} aria-hidden>
            <svg className={figureVariants({ view, isReceded })} viewBox="-100 -100 200 200">
                <Drawing />
            </svg>
        </div>
    );
}
