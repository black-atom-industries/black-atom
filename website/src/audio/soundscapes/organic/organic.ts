import type * as ToneModule from "tone";
import type { Soundscape, SoundscapeContext, ThemeRoot } from "#/audio/soundscape.ts";
import type { SceneEvent } from "#/background/types.ts";
import { createBands } from "./bands.ts";
import { createBed } from "./bed.ts";
import { createDrone, type Drone } from "./drone.ts";
import { createHeartbeat, type Heartbeat } from "./heartbeat.ts";
import { clamp, type Layer, type LayerContext, type OrganicState } from "./layer.ts";
import { createMotion } from "./motion.ts";
import { organicParams, type OrganicParams } from "./params.ts";
import { createVinyl } from "./vinyl.ts";
import { createVoices, type Voices } from "./voices.ts";

export const organicLayers = [
    "drone",
    "bed",
    "bands",
    "voices",
    "heartbeat",
    "vinyl",
    "motion",
] as const;
type LayerId = (typeof organicLayers)[number];

const tick = 0.05;
const idleSpeed = 0.05;

interface Built {
    drone: Drone;
    voices: Voices;
    heartbeat: Heartbeat;
    all: Record<LayerId, Layer>;
    mutes: Map<LayerId, ToneModule.Gain[]>;
    nodes: { dispose(): unknown }[];
    interval: number;
    context: ToneModule.BaseContext;
}

/** v5's organic soundscape: drone, noise bed, disk bands, struck and sung lines, heartbeat, plus vinyl and camera air. */
export function createOrganic(): Soundscape<typeof organicParams> {
    let params: OrganicParams = organicParams.parse({});
    let root: ThemeRoot = { ratio: 1, isLight: false };
    let hasTheme = false;
    let built: Built | undefined;
    let muted: ReadonlySet<string> = new Set();

    let distance = 1.6;
    let energy = 0;
    let speed = idleSpeed;
    let drift = 0;
    let lastCameraAt = 0;
    let volatility = 0;
    let volatilityTarget = 0;
    let volatilityClock = 0;

    function state(): OrganicState {
        const prox = clamp((1.6 - distance) / 1.3, 0, 1);
        return {
            params,
            root,
            prox,
            energy,
            motion: clamp((speed - 0.02) / 0.5, 0, 1),
            drift,
            volatility,
            isBeating: built?.heartbeat.isBeating ?? false,
        };
    }

    function update(time: number) {
        if (!built) return;
        const current = state();
        built.drone.update(current, time);
        for (const id of organicLayers) if (id !== "drone") built.all[id].update(current, time);
        applyMutes(time);
    }

    function applyMutes(time: number) {
        if (!built) return;
        for (const id of organicLayers) {
            for (const gain of built.mutes.get(id) ?? []) {
                gain.gain.setTargetAtTime(muted.has(id) ? 0 : 1, time, 0.05);
            }
        }
    }

    function step(ctx: SoundscapeContext) {
        const now = ctx.context.now();
        const prox = clamp((1.6 - distance) / 1.3, 0, 1);
        volatilityClock -= tick;
        if (volatilityClock <= 0) {
            volatilityTarget = ctx.random() ** (2 - 1.2 * prox);
            volatilityClock = 0.08 + ctx.random() * (0.9 - 0.6 * prox);
        }
        volatility += (volatilityTarget - volatility) * (1 - Math.exp(-tick * (4 + 10 * prox)));
        if (now - lastCameraAt > 0.3) {
            speed = idleSpeed + (speed - idleSpeed) * Math.exp(-tick * 3);
            drift *= Math.exp(-tick * 3);
        }
        update(now);
    }

    return {
        id: "organic",
        params: organicParams,
        layers: organicLayers,
        build(ctx) {
            const { tone } = ctx;
            const nodes: { dispose(): unknown }[] = [];
            function keep<Node extends { dispose(): unknown }>(node: Node): Node {
                nodes.push(node);
                return node;
            }

            let airCutoff = 18000;
            const pre = keep(new tone.Gain(1));
            const air = keep(new tone.Filter({ type: "lowpass", frequency: 18000, Q: 0.8 }));
            // A Butterworth pair; `lowCutQ` reshapes the second stage around its 0.707 default.
            const lowCut = keep(
                new tone.Filter({ type: "highpass", frequency: params.lowCut, Q: 0.5412 }),
            );
            const lowCutSecond = keep(
                new tone.Filter({ type: "highpass", frequency: params.lowCut, Q: 1.3066 }),
            );
            const post = keep(new tone.Gain(1));
            const level = keep(new tone.Gain(0));
            const sends = keep(new tone.Gain(1));
            const sendLevel = keep(new tone.Gain(0));
            pre.chain(air, lowCut, lowCutSecond, post, level, ctx.bus);
            sends.chain(sendLevel, ctx.reverb);

            const mutes = new Map<LayerId, ToneModule.Gain[]>();
            function layerContext(id: LayerId, out: ToneModule.InputNode): LayerContext {
                const dry = keep(new tone.Gain(1)).connect(out);
                const wet = keep(new tone.Gain(1)).connect(sends);
                mutes.set(id, [dry, wet]);
                return { ...ctx, out: dry, send: wet };
            }

            const drone = createDrone(layerContext("drone", pre));
            const voices = createVoices(layerContext("voices", pre));
            const heartbeat = createHeartbeat(layerContext("heartbeat", post), {
                onKick(time) {
                    drone.duck(time, state());
                    ctx.context.draw.schedule(() => ctx.visual.pulse(0.7), time);
                },
            });
            const all: Record<LayerId, Layer> = {
                drone,
                bed: createBed(layerContext("bed", pre)),
                bands: createBands(layerContext("bands", pre)),
                voices,
                heartbeat,
                vinyl: createVinyl(layerContext("vinyl", post)),
                motion: createMotion(layerContext("motion", pre)),
            };

            const interval = ctx.context.setInterval(() => {
                step(ctx);
                const now = ctx.context.now();
                const prox = clamp((1.6 - distance) / 1.3, 0, 1);
                const near = params.globalLowpassNear;
                const swell =
                    Math.max(
                        0,
                        0.55 * Math.sin((now * 2 * Math.PI) / 53) +
                            0.45 * Math.sin((now * 2 * Math.PI) / 31 + 1.7),
                    ) ** 3;
                const cutoff = Math.min(
                    20000,
                    near * (18000 / near) ** ((1 - prox) ** 1.4) * 2 ** (1.6 * swell),
                );
                air.frequency.setTargetAtTime(cutoff, now, cutoff > airCutoff ? 0.7 : 0.15);
                airCutoff = cutoff;
                lowCut.frequency.setTargetAtTime(params.lowCut, now, 0.1);
                lowCutSecond.frequency.setTargetAtTime(params.lowCut, now, 0.1);
                lowCutSecond.Q.setTargetAtTime((1.3066 * params.lowCutQ) / 0.707, now, 0.1);
                const output = 0.8 * params.soundVolume;
                level.gain.setTargetAtTime(output, now, 0.1);
                const motion = clamp((speed - 0.02) / 0.5, 0, 1);
                sendLevel.gain.setTargetAtTime(
                    output * 1.1 * params.reverbAmount * (1 - 0.6 * motion),
                    now,
                    motion > 0.1 ? 0.08 : 0.6,
                );
            }, tick);

            built = { drone, voices, heartbeat, all, mutes, nodes, interval, context: ctx.context };
            update(ctx.context.now());
        },
        onScene(event: SceneEvent) {
            if (event.type === "proximity") {
                distance = event.distance;
                energy = event.energy;
            } else if (event.type === "camera") {
                speed = event.speed;
                drift = event.drift;
                lastCameraAt = built?.context.now() ?? 0;
            } else if (built) {
                built.voices.absorb(event, state());
            }
        },
        setParams(partial) {
            params = organicParams.parse({ ...params, ...partial });
            if (built) update(built.context.now());
        },
        setTheme(next) {
            const isChange =
                hasTheme && (next.ratio !== root.ratio || next.isLight !== root.isLight);
            root = next;
            hasTheme = true;
            if (!built) return;
            update(built.context.now());
            if (isChange) built.voices.chime(state());
        },
        mute(next) {
            muted = next;
            if (built) applyMutes(built.context.now());
        },
        dispose() {
            if (!built) return;
            built.context.clearInterval(built.interval);
            for (const id of organicLayers) built.all[id].dispose();
            for (const node of built.nodes) node.dispose();
            built = undefined;
        },
    };
}
