import type * as ToneModule from "tone";
import type { SoundscapeContext, ThemeRoot } from "#/audio/soundscape.ts";
import type { OrganicParams } from "./params.ts";

/** One snapshot of everything the layers follow, refreshed on every update tick. */
export interface OrganicState {
    params: OrganicParams;
    root: ThemeRoot;
    /** 0 far from the hole, 1 at the event horizon. */
    prox: number;
    energy: number;
    /** Camera movement, 0 at rest to 1 fast. */
    motion: number;
    /** Sideways direction of travel, -1 to 1. */
    drift: number;
    /** Random surges whose rate and depth rise with proximity. */
    volatility: number;
    isBeating: boolean;
}

export interface LayerContext extends SoundscapeContext {
    /** This layer's dry output. */
    out: ToneModule.InputNode;
    /** This layer's reverb send. */
    send: ToneModule.InputNode;
}

export interface Layer {
    update(state: OrganicState, time: number): void;
    dispose(): void;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function smoothstep(from: number, to: number, x: number): number {
    const k = clamp((x - from) / (to - from), 0, 1);
    return k * k * (3 - 2 * k);
}

export function saturation(x: number): number {
    return Math.tanh(x * 1.6) / Math.tanh(1.6);
}

/** Loops `seconds` of white noise built from the soundscape's random source. */
export function loopNoise(
    ctx: SoundscapeContext,
    { seconds, gain, playbackRate = 1 }: { seconds: number; gain: number; playbackRate?: number },
): AudioBufferSourceNode {
    const raw = ctx.context.rawContext;
    const buffer = raw.createBuffer(1, Math.round(raw.sampleRate * seconds), raw.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (ctx.random() * 2 - 1) * gain;
    const source = raw.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = playbackRate;
    source.start(ctx.context.currentTime);
    return source;
}

export function stopSource(source: AudioScheduledSourceNode) {
    source.stop();
    source.disconnect();
}
