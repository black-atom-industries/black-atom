import * as Tone from "tone";
import { describe, expect, test } from "vitest";
import { buildMasterChain, mountSoundscape } from "#/audio/engine.ts";
import { themeRoot } from "#/audio/soundscape.ts";
import { rng } from "#/background/rng.ts";
import type { SceneEvent } from "#/background/types.ts";
import { createOrganic } from "./organic.ts";
import type { OrganicParams } from "./params.ts";

const seconds = 4;

interface Script {
    params?: Partial<OrganicParams>;
    distance?: number;
    cameraSpeed?: number;
    solo?: string;
}

interface Measure {
    peakDb: number;
    rmsDb: number;
    hasNaN: boolean;
    pulses: number;
}

const decibels = (value: number) => 20 * Math.log10(Math.max(value, 1e-12));

async function render({ params = {}, distance = 1, cameraSpeed, solo }: Script): Promise<Measure> {
    let pulses = 0;
    const buffer = await Tone.Offline(
        (context) => {
            const random = rng(7);
            const chain = buildMasterChain(Tone, random);
            chain.master.gain.value = 1;
            const organic = createOrganic();
            organic.setParams(params);
            organic.setTheme(themeRoot("black-atom-default-dark", "dark"));
            if (solo) organic.mute(new Set(organic.layers.filter((layer) => layer !== solo)));
            mountSoundscape(Tone, chain, organic, {
                visual: { sing: () => undefined, pulse: () => pulses++ },
                random,
                level: 1,
            });
            const { transport } = context;
            const events: [number, SceneEvent][] = [];
            for (let t = 0; t < seconds; t += 0.05) {
                events.push([t, { type: "proximity", distance, energy: 0.4 }]);
                if (cameraSpeed !== undefined) {
                    events.push([
                        t,
                        { type: "camera", speed: cameraSpeed, drift: 0.8, phase: "move" },
                    ]);
                }
            }
            for (const t of [0.4, 0.9, 1.3, 2.1, 2.6, 3.2]) {
                events.push([
                    t,
                    { type: "absorb", hue: t / 4, pan: Math.sin(t * 3), strength: 0.8 },
                ]);
            }
            for (const [time, event] of events) {
                transport.schedule(() => organic.onScene(event), time);
            }
            transport.start(0);
        },
        seconds,
        2,
        44100,
    );
    const channels = buffer.toArray();
    const samples = (Array.isArray(channels) ? channels : [channels]).flatMap((channel) => [
        ...channel,
    ]);
    // The first half second is the fade from silence; measure the settled sound after it.
    const settled = samples.filter((_, i) => i % (44100 * seconds) > 22050);
    const peak = samples.reduce((max, x) => Math.max(max, Math.abs(x)), 0);
    const rms = Math.sqrt(settled.reduce((sum, x) => sum + x * x, 0) / settled.length);
    return {
        peakDb: decibels(peak),
        rmsDb: decibels(rms),
        hasNaN: samples.some((x) => Number.isNaN(x)),
        pulses,
    };
}

function report(label: string, measure: Measure) {
    console.info(
        `[organic] ${label}: peak ${measure.peakDb.toFixed(2)} dBFS, RMS ${measure.rmsDb.toFixed(2)} dBFS, NaN ${measure.hasNaN}, pulses ${measure.pulses}`,
    );
}

describe("organic, rendered offline", () => {
    test("plays its defaults with a heartbeat: audible, finite, below 0 dBFS", async () => {
        const measure = await render({ params: { heartbeat: true } });
        report("defaults + heartbeat", measure);
        expect(measure.hasNaN).toBe(false);
        expect(measure.rmsDb).toBeGreaterThan(-70);
        expect(measure.peakDb).toBeLessThan(0);
    });

    test("stays below 0 dBFS pushed hard near the hole", async () => {
        const measure = await render({
            distance: 0.4,
            params: { heartbeat: true, linesVolume: 3, soundVolume: 2, vinyl: 1, atomVolume: 3 },
            cameraSpeed: 1.2,
        });
        report("pushed", measure);
        expect(measure.hasNaN).toBe(false);
        expect(measure.peakDb).toBeLessThan(0);
    });

    test("vinyl raises the level", async () => {
        const without = await render({ params: { vinyl: 0 } });
        const full = await render({ params: { vinyl: 1 } });
        report("vinyl 0", without);
        report("vinyl 100", full);
        expect(full.rmsDb).toBeGreaterThan(without.rmsDb);
    });

    test("a fast camera raises the level, and its air stays under the drone", async () => {
        const still = await render({ cameraSpeed: 0.05 });
        const fast = await render({ cameraSpeed: 1.2 });
        const air = await render({ cameraSpeed: 1.2, solo: "motion" });
        const drone = await render({ cameraSpeed: 1.2, solo: "drone" });
        report("camera still", still);
        report("camera fast", fast);
        report("motion solo, fast", air);
        report("drone solo", drone);
        expect(fast.rmsDb).toBeGreaterThan(still.rmsDb);
        expect(air.rmsDb).toBeLessThan(drone.rmsDb);
    });
});
