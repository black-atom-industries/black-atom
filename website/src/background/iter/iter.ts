import { rng } from "#/background/rng.ts";
import {
    createScene2dRenderer,
    TAU,
    type Frame,
    type Point,
    type Scene2d,
} from "#/background/scene-2d.ts";
import type { BackgroundRenderer } from "#/background/types.ts";

interface Line {
    points: Point[];
    /** Cumulative length at each point. */
    lengths: number[];
    total: number;
    colorIndex: number;
    offset: number;
    speed: number;
    /** Position (0..1) of a review note on the line, or -1. */
    note: number;
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, steps: number, out: Point[]) {
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        const a = u * u * u;
        const b = 3 * u * u * t;
        const c = 3 * u * t * t;
        const d = t * t * t;
        out.push([
            a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
            a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
        ]);
    }
}

/** Index of the last point before fraction `f` of the line's length. */
function indexAt(line: Line, f: number): number {
    const target = f * line.total;
    let lo = 0;
    let hi = line.lengths.length - 1;
    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if ((line.lengths[mid] ?? 0) < target) lo = mid;
        else hi = mid;
    }
    return lo;
}

function pointAt(points: Point[], index: number): Point {
    return points[index] ?? [0, 0];
}

/** Changes stream in from the left, orbit the review ring, and leave as one strand to the right. */
function iterScene(context: CanvasRenderingContext2D): Scene2d {
    let lines: Line[] = [];
    let ring: Frame = { x: 0, y: 0, r: 0 };

    return {
        build({ width, height }, frame) {
            const random = rng(7);
            ring = frame;
            const { x: cx, y: cy, r: R } = frame;
            const count = width < 700 ? 34 : 58;
            lines = Array.from({ length: count }, () => {
                const y0 = height * (0.06 + random() * 0.9);
                const r = R * (0.82 + random() * 0.42);
                const a0 = Math.PI + (random() - 0.5) * 1.3;
                const sweep = TAU * (0.55 + random() * 0.75);
                const points: Point[] = [[-60, y0]];
                const entry: Point = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
                const tangentIn: Point = [-Math.sin(a0), Math.cos(a0)];
                cubic(
                    [-60, y0],
                    [cx - R * 3.2, y0],
                    [entry[0] - tangentIn[0] * r * 0.9, entry[1] - tangentIn[1] * r * 0.9],
                    entry,
                    40,
                    points,
                );
                const steps = Math.ceil(sweep * 18);
                for (let k = 1; k <= steps; k++) {
                    const a = a0 + (sweep * k) / steps;
                    points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
                }
                const a1 = a0 + sweep;
                const exit: Point = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
                const tangentOut: Point = [-Math.sin(a1), Math.cos(a1)];
                const y1 = cy + (random() - 0.5) * R * 0.5;
                cubic(
                    exit,
                    [exit[0] + tangentOut[0] * r * 0.9, exit[1] + tangentOut[1] * r * 0.9],
                    [cx + R * 2.2, y1],
                    [width + 60, y1],
                    40,
                    points,
                );
                const lengths = [0];
                for (let j = 1; j < points.length; j++) {
                    const [xa, ya] = pointAt(points, j - 1);
                    const [xb, yb] = pointAt(points, j);
                    lengths.push((lengths[j - 1] ?? 0) + Math.hypot(xb - xa, yb - ya));
                }
                return {
                    points,
                    lengths,
                    total: lengths.at(-1) ?? 0,
                    colorIndex: Math.floor(random() * 6),
                    offset: random(),
                    speed: 0.025 + random() * 0.03,
                    note: random() < 0.18 ? 0.25 + random() * 0.5 : -1,
                };
            });
        },
        draw(t, _viewport, colors) {
            const glowMode = colors.isLight ? "source-over" : "lighter";
            context.lineCap = "round";
            lines.forEach((line, i) => {
                const color = colors.palette[line.colorIndex] ?? colors.accent;
                const first = pointAt(line.points, 0);
                context.globalCompositeOperation = "source-over";
                context.globalAlpha = colors.isLight ? 0.22 : 0.14;
                context.strokeStyle = color;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(first[0], first[1]);
                line.points.forEach(([x, y]) => context.lineTo(x, y));
                context.stroke();

                const head = (t * line.speed + line.offset) % 1;
                const a = indexAt(line, Math.max(0, head - 0.09));
                const b = indexAt(line, head);
                context.globalCompositeOperation = glowMode;
                context.lineWidth = 1.8;
                context.shadowColor = color;
                context.shadowBlur = colors.isLight ? 0 : 10;
                for (let s = a; s < b; s++) {
                    const from = pointAt(line.points, s);
                    const to = pointAt(line.points, s + 1);
                    context.globalAlpha = 0.9 * ((s - a) / Math.max(1, b - a));
                    context.beginPath();
                    context.moveTo(from[0], from[1]);
                    context.lineTo(to[0], to[1]);
                    context.stroke();
                }
                context.shadowBlur = 0;

                if (line.note > 0) {
                    const [qx, qy] = pointAt(line.points, indexAt(line, line.note));
                    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i);
                    context.globalCompositeOperation = "source-over";
                    context.globalAlpha = 0.5 + 0.5 * pulse;
                    context.fillStyle = colors.accent;
                    context.beginPath();
                    context.arc(qx, qy, 2.6, 0, TAU);
                    context.fill();
                    context.globalAlpha = 0.25 * pulse;
                    context.strokeStyle = colors.accent;
                    context.lineWidth = 1;
                    context.beginPath();
                    context.arc(qx, qy, 7 + 5 * pulse, 0, TAU);
                    context.stroke();
                }
            });

            context.globalCompositeOperation = "source-over";
            context.strokeStyle = colors.sub;
            context.lineWidth = 1;
            [0.55, 1, 1.5].forEach((k, i) => {
                context.globalAlpha = 0.18 - i * 0.04;
                context.beginPath();
                context.arc(ring.x, ring.y, ring.r * k, 0, TAU);
                context.stroke();
            });
            const ra = t * 0.35;
            context.globalAlpha = 1;
            context.strokeStyle = colors.accent;
            context.lineWidth = 3;
            context.shadowColor = colors.accent;
            context.shadowBlur = colors.isLight ? 0 : 16;
            context.beginPath();
            context.arc(ring.x, ring.y, ring.r, ra, ra + Math.PI / 2);
            context.stroke();
            context.fillStyle = colors.accent;
            context.beginPath();
            context.arc(
                ring.x + ring.r * Math.cos(ra + Math.PI / 2),
                ring.y + ring.r * Math.sin(ra + Math.PI / 2),
                6,
                0,
                TAU,
            );
            context.fill();
            context.shadowBlur = 0;
        },
    };
}

export function createIterScene(): BackgroundRenderer {
    return createScene2dRenderer(iterScene);
}
