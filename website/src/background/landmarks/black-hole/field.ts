import { MathUtils, Vector3 } from "three/webgpu";
import { rng } from "#/background/rng.ts";
import { flowDir, flowSide, flowUp } from "#/background/space/axes.ts";
import { buildTubes, type Tubes } from "#/background/space/tube.ts";

const TAU = Math.PI * 2;
const GOLD = 0.6180339887;
/** Integration step for near lines, in world units (1 unit = 1 px at the hole). */
const STEP = 14;

const WAVES = [
    [0.28, 0.9, 0.0011, 1.3],
    [0.16, 2.2, 0.0019, 4.1],
    [0.09, 5.1, 0.0033, 2.7],
] as const;

const swirlAxis = flowUp
    .clone()
    .multiplyScalar(-1)
    .add(new Vector3(0.12, 0.2, 0))
    .normalize();

const waves = WAVES.map(([amp, angle, k, phase], j) => ({
    amp,
    k,
    phase,
    kn: flowUp
        .clone()
        .multiplyScalar(Math.cos(angle + 1.1))
        .addScaledVector(flowDir, Math.sin(angle + 1.1))
        .addScaledVector(flowSide, 0.4 * (j % 2 ? 1 : -1)),
    kd: flowSide
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(flowDir, Math.sin(angle))
        .addScaledVector(flowUp, 0.55 * (j % 2 ? -1 : 1)),
    dd: flowSide.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(flowDir, Math.cos(angle)),
}));

export interface Line {
    /** Every third point of the line, for collision tests. */
    samples: Vector3[];
    /** Arc length at each sample. */
    sampleArcs: number[];
    /** Matches the `ext.w` vertex attribute, so a shader can pick this line. */
    id: number;
    hit: boolean;
    length: number;
    offset: number;
    /** Gap between pulses along the line. */
    gap: number;
    hue: number;
    /** Thickness tier, 0..1. */
    weight: number;
    /** Direction from the hole to where the line ends. */
    end: Vector3;
    isFar: boolean;
    isNear: boolean;
    cooldown: number;
    lastPulse?: number;
}

export interface Streamlines {
    /** One tube per line, in the order of `lines`. */
    tubes: Tubes;
    lines: Line[];
    farCount: number;
}

const swirl = new Vector3();

function field(p: Vector3, R: number, out: Vector3): Vector3 {
    out.copy(flowDir);
    waves.forEach((w) => {
        const c = w.amp * Math.cos(p.dot(w.kd) * w.k + w.phase);
        const ph2 = p.dot(w.kn) * w.k * 0.9 + w.phase * 1.7;
        out.addScaledVector(w.dd, c * 0.5).addScaledVector(flowUp, 0.35 * w.amp * Math.cos(ph2));
    });
    const r2 = p.lengthSq();
    const k = (1 / (r2 + 0.12 * R * R)) * (1 + 1.4 * Math.exp(-Math.sqrt(r2) / (R * 6)));
    swirl.crossVectors(swirlAxis, p);
    return out.addScaledVector(p, -1.1 * R * k).addScaledVector(swirl, 1.7 * R * k);
}

const inward = new Vector3();
const around = new Vector3();

function fieldIn(p: Vector3, R: number, out: Vector3): Vector3 {
    const r = p.length();
    const k = Math.min(1, Math.pow((7 * R) / r, 1.3));
    inward.copy(p).multiplyScalar(-1 / r);
    around.crossVectors(swirlAxis, inward).normalize();
    out.copy(flowDir)
        .multiplyScalar(1 - k)
        .addScaledVector(inward, 1.5 * k)
        .addScaledVector(around, -1.3 * k);
    waves.forEach((w) => {
        out.addScaledVector(w.dd, 0.6 * w.amp * Math.cos(p.dot(w.kd) * w.k + w.phase) * (1 - k));
    });
    return out;
}

interface Traced {
    points: Vector3[];
    radii: number[];
    hit: boolean;
    seed: number;
    isFar: boolean;
}

/**
 * Traces the streamlines around a hole of radius `R` and builds their tube geometry. Far lines
 * come first so the draw range can grow over the near ones.
 */
export function buildStreamlines(R: number, count: number, isSmall: boolean): Streamlines {
    const random = rng(23);
    const domain = 6400;
    const upstream = 7000;
    const v = new Vector3();
    const mid = new Vector3();
    const q = new Vector3();
    const p = new Vector3();
    const traced: Traced[] = [];
    const farTotal = isSmall ? 60 : 220;

    for (let ii = 0; ii < farTotal + count; ii++) {
        const isFar = ii < farTotal;
        const seed = isFar ? ii + 1000 : ii - farTotal;
        if (isFar) {
            const fr = 1 + Math.sqrt(random()) * 1.9;
            const fth = random() * TAU;
            const step = 46;
            p.copy(flowDir)
                .multiplyScalar(-(14000 + random() * 4000))
                .addScaledVector(flowSide, Math.cos(fth) * fr * 5200)
                .addScaledVector(flowUp, Math.sin(fth) * fr * 4200);
            const points: Vector3[] = [];
            const radii: number[] = [];
            for (let st = 0; st < 1400; st++) {
                field(p, R, v).normalize();
                q.copy(p).addScaledVector(v, step * 0.5);
                field(q, R, mid).normalize();
                p.addScaledVector(mid, step);
                if (st % 2 === 0) {
                    points.push(p.clone());
                    radii.push(p.length());
                }
                if (p.dot(flowDir) > 15000) break;
            }
            if (points.length > 6) traced.push({ points, radii, hit: false, seed, isFar });
            continue;
        }
        const ra = Math.sqrt((seed * 0.7548776 + 0.13) % 1);
        const th = ((seed * 0.5698403 + 0.29) % 1) * TAU;
        const uu = Math.cos(th) * ra * 4600 + (random() - 0.5) * 60;
        const vv = Math.sin(th) * ra * 3600 + (random() - 0.5) * 60;
        const isInflow = (seed * GOLD + 0.37) % 1 < 0.16;
        const flow = isInflow ? fieldIn : field;
        if (isInflow) {
            p.copy(flowDir)
                .multiplyScalar(-(2600 + random() * 3400))
                .addScaledVector(flowSide, Math.cos(th) * ra * 2400)
                .addScaledVector(flowUp, Math.sin(th) * ra * 2000);
        } else {
            p.copy(flowDir)
                .multiplyScalar(-upstream)
                .addScaledVector(flowSide, uu)
                .addScaledVector(flowUp, vv);
        }
        const points: Vector3[] = [];
        const radii: number[] = [];
        let hit = false;
        for (let st = 0; st < 3200; st++) {
            flow(p, R, v).normalize();
            q.copy(p).addScaledVector(v, STEP * 0.5);
            flow(q, R, mid).normalize();
            p.addScaledVector(mid, STEP);
            const r = p.length();
            if (st % 4 === 0 || r < R * 5) {
                points.push(p.clone());
                radii.push(r);
            }
            if (r < R * 0.7) {
                hit = true;
                break;
            }
            if (r > domain && p.dot(mid) > 0 && st > 50) break;
        }
        if (points.length >= 6) traced.push({ points, radii, hit, seed, isFar });
    }

    const tubes = traced.map(({ points, radii, hit, seed, isFar }, k) => {
        const tr = (seed * 0.7548776 + 0.31) % 1;
        const tj = (seed * 0.2360679) % 1;
        const tier =
            tr < 0.55
                ? 0.45 + tj * 0.6
                : tr < 0.85
                  ? 1.4 + tj * 1.6
                  : tr < 0.96
                    ? 3.8 + tj * 3
                    : 9 + tj * 7;
        const r0 = tier * (isSmall ? 0.8 : 1) * (isFar ? 3 : 1);
        const gap = 900 + ((seed * 0.5698403) % 1) * 2100;
        return {
            points,
            widths: radii.map((r) => r0 * (0.3 + 0.7 * MathUtils.smoothstep(r, R, R * 4))),
            offset: ((seed * 0.4142135) % 1) * gap,
            gap,
            hue: (seed * 0.381966 + 0.11) % 1,
            flag: hit ? 1 : 0,
            id: k + 1,
            tier,
        };
    });
    const built = buildTubes(tubes);
    const lines: Line[] = traced.map(({ points, hit, isFar }, k) => {
        const n = points.length;
        const arc = built.arcs[k];
        const tube = tubes[k];
        const sampled = points.flatMap((_, j) => (j % 3 === 0 || j === n - 1 ? [j] : []));
        return {
            samples: sampled.map((j) => points[j]),
            sampleArcs: sampled.map((j) => arc[j]),
            id: k + 1,
            hit,
            length: arc[n - 1],
            offset: tube.offset,
            gap: tube.gap,
            hue: tube.hue,
            weight: MathUtils.clamp(Math.log(tube.tier / 0.45) / 3.57, 0, 1),
            end: points[n - 1].clone().normalize(),
            isFar,
            isNear: false,
            cooldown: 0,
        };
    });

    return {
        tubes: built,
        lines,
        farCount: lines.filter((line) => line.isFar).length,
    };
}
