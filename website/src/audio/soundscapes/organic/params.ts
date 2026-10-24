import { z } from "zod";

function level(fallback: number, max: number) {
    return z.number().min(0).max(max).default(fallback);
}

function hertz(fallback: number, min: number, max: number) {
    return z.number().min(min).max(max).default(fallback);
}

export const organicParams = z.object({
    soundVolume: level(0.15, 2),
    soundDistortion: level(0, 3),
    atomVolume: level(1.5, 3),
    atomLowpass: hertz(128, 40, 200),
    atomLowpassBoost: level(0.72, 1),
    droneNoise: level(1, 3),
    linesVolume: level(0.35, 3),
    lineClickNoise: level(1, 2),
    diskVolume: level(1, 3),
    ringNoise: level(0.5, 6),
    ringNoiseHz: hertz(5200, 1500, 10000),
    ringSwell: level(1, 2.5),
    diskPull: level(1.5, 1.5),
    diskLineGlow: level(4, 4),
    globalLowpassNear: hertz(2390, 150, 6000),
    lowCut: hertz(80, 20, 120),
    lowCutQ: z.number().min(0.3).max(4).default(0.3),
    reverbAmount: level(1, 2),
    heartbeat: z.boolean().default(false),
    bpm: z.number().int().min(80).max(140).default(96),
    heartbeatVolume: level(1, 2),
    duckDepth: level(1, 1),
    duckRelease: z.number().min(0.05).max(0.6).default(0.6),
    vinyl: level(0.3, 1),
    motionVolume: level(1, 3),
});

export type OrganicParams = z.infer<typeof organicParams>;
