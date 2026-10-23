import type * as ToneModule from "tone";
import { clamp, saturation, type Layer, type LayerContext, type OrganicState } from "./layer.ts";

const voicing = [
    { frequency: 41.2, type: "sine", gain: 1.2 },
    { frequency: 82.4, type: "sine", gain: 0.35 },
    { frequency: 41.2, type: "triangle", gain: 0.25 },
] as const;

const chorus = [
    { delay: 0.019, depth: 0.006, rate: 0.23, pan: -0.8 },
    { delay: 0.024, depth: 0.007, rate: 0.17, pan: 0.8 },
    { delay: 0.031, depth: 0.005, rate: 0.29, pan: 0 },
] as const;

/** The drone's level before the atom bus, shared with the noise bed that rides on it. */
export function droneLevel(state: OrganicState): number {
    const p2 = state.prox * state.prox;
    const v = state.volatility * (0.35 + 0.65 * state.prox);
    return (state.isBeating ? 1 - 0.35 * p2 : 1) * (0.12 + 0.55 * p2) * (1 + 0.25 * v);
}

export interface Drone extends Layer {
    /** The heartbeat's kick at `time` presses the drone down and opens a high-pass. */
    duck(time: number, state: OrganicState): void;
}

/** Detuned oscillators tuned to the theme root, through a resonant atom low-pass, swelling with proximity. */
export function createDrone(ctx: LayerContext): Drone {
    const { tone } = ctx;
    const nodes: { dispose(): unknown }[] = [];
    function keep<Node extends { dispose(): unknown }>(node: Node): Node {
        nodes.push(node);
        return node;
    }

    const drive = keep(new tone.Gain(0.5));
    const shelf = keep(new tone.Filter({ type: "lowshelf", frequency: 60, gain: 9 })).connect(
        drive,
    );
    const oscillators = voicing.map((voice) => {
        const oscillator = keep(new tone.Oscillator(voice.frequency, voice.type));
        oscillator.chain(keep(new tone.Gain(voice.gain)), shelf);
        oscillator.start();
        return { oscillator, base: voice.frequency };
    });

    const lp = keep(new tone.Filter({ type: "lowpass", frequency: 110, Q: 6 }));
    const lp2 = keep(new tone.Filter({ type: "lowpass", frequency: 160, Q: 0.7 }));
    const hp = keep(new tone.Filter({ type: "highpass", frequency: 18, Q: 0.5 }));
    const cut1 = keep(new tone.Filter({ type: "lowpass", frequency: 90, Q: 0.54 }));
    const cut2 = keep(new tone.Filter({ type: "lowpass", frequency: 90, Q: 1.31 }));
    const bassProx = keep(new tone.Filter({ type: "lowshelf", frequency: 75, gain: 0 }));
    const satIn = keep(new tone.Gain(1.2));
    const shaper = keep(new tone.WaveShaper(saturation, 2048));
    shaper.oversample = "4x";
    const satOut = keep(new tone.Gain(0.8));
    const atomBoost = keep(new tone.Filter({ type: "peaking", frequency: 70, Q: 0.8, gain: 0 }));
    const pulse = keep(new tone.Gain(0.6));
    const droneGain = keep(new tone.Gain(0.05));
    const atomBus = keep(new tone.Gain(1));
    const duckGain = keep(new tone.Gain(1));
    const sidechainHp = keep(new tone.Filter({ type: "highpass", frequency: 15, Q: 0.7 }));
    drive.chain(lp, lp2, hp, cut1, cut2, bassProx, satIn, shaper, satOut, atomBoost, pulse);
    pulse.chain(droneGain, atomBus, sidechainHp, duckGain, ctx.out);

    const wobble = keep(new tone.Oscillator(0.11, "sine"));
    wobble.chain(keep(new tone.Gain(28)), lp.frequency);
    wobble.start();

    // A slow inverted saw, smoothed: each swell lifts the level and closes the atom filter.
    const heart = keep(new tone.Oscillator(0.35, "sawtooth"));
    const heartSmooth = keep(new tone.Filter({ type: "lowpass", frequency: 3, Q: 0.5 }));
    const heartDepth = keep(new tone.Gain(-0.35));
    const heartCutoff = keep(new tone.Gain(-25));
    heart.connect(heartSmooth);
    heartSmooth.chain(heartDepth, pulse.gain);
    heartSmooth.chain(heartCutoff, cut2.frequency);
    heart.start();

    // Ghost: chorus and flanger on the drone after the atom low-pass, faded in by proximity.
    const ghostIn = keep(new tone.Gain(0));
    const ghostWet = keep(new tone.Gain(1));
    cut2.chain(
        keep(new tone.Filter({ type: "highpass", frequency: 90, Q: 0.7 })),
        keep(new tone.Filter({ type: "lowpass", frequency: 520, Q: 0.9 })),
        ghostIn,
    );
    function modulate(delay: ToneModule.Delay, rate: number, depth: number) {
        const lfo = keep(new tone.Oscillator(rate, "sine"));
        lfo.chain(keep(new tone.Gain(depth)), delay.delayTime);
        lfo.start();
    }
    for (const voice of chorus) {
        const delay = keep(new tone.Delay(voice.delay, 0.1));
        modulate(delay, voice.rate, voice.depth);
        ghostIn.chain(delay, keep(new tone.Gain(0.5)), keep(new tone.Panner(voice.pan)), ghostWet);
    }
    const flanger = keep(new tone.Delay(0.004, 0.05));
    modulate(flanger, 0.06, 0.0032);
    const flangerFeedback = keep(new tone.Gain(0.72));
    ghostIn.connect(flanger);
    flanger.chain(flangerFeedback, flanger);
    flanger.chain(keep(new tone.Gain(0.6)), ghostWet);
    ghostWet.connect(atomBus);
    ghostWet.chain(keep(new tone.Gain(0.5)), ctx.send);
    droneGain.chain(keep(new tone.Gain(0.18)), ctx.send);

    let ratio = 0;

    return {
        update(state, time) {
            const { params, prox } = state;
            const p2 = prox * prox;
            const v = state.volatility * (0.35 + 0.65 * prox);
            if (state.root.ratio !== ratio) {
                const isFirst = ratio === 0;
                ratio = state.root.ratio;
                for (const { oscillator, base } of oscillators) {
                    oscillator.frequency.setTargetAtTime(base * ratio, time, isFirst ? 0.01 : 1.2);
                }
            }
            bassProx.gain.setTargetAtTime((state.isBeating ? 5 : 15) * prox ** 1.5, time, 0.4);
            droneGain.gain.setTargetAtTime(droneLevel(state), time, 0.12);
            ghostIn.gain.setTargetAtTime(0.03 + 0.22 * p2, time, 0.3);
            wobble.frequency.setTargetAtTime(0.11 * (1 - 0.8 * p2), time, 0.5);
            cut1.frequency.setTargetAtTime(params.atomLowpass, time, 0.1);
            cut2.frequency.setTargetAtTime(params.atomLowpass, time, 0.1);
            cut2.Q.setTargetAtTime(1.31 + params.atomLowpassBoost * 6, time, 0.1);
            atomBoost.frequency.setTargetAtTime(Math.max(40, params.atomLowpass * 0.75), time, 0.1);
            atomBoost.gain.setTargetAtTime(params.atomLowpassBoost * 18, time, 0.1);
            atomBus.gain.setTargetAtTime(params.atomVolume, time, 0.1);
            satIn.gain.setTargetAtTime(
                (0.8 + 1.6 * p2) * Math.max(0.05, params.soundDistortion),
                time,
                0.2,
            );
            heart.frequency.setTargetAtTime(0.35 + 0.55 * p2, time, 0.8);
            heartDepth.gain.setTargetAtTime(-(0.3 + 0.3 * p2), time, 0.5);
            heartCutoff.gain.setTargetAtTime(-(20 + 50 * p2), time, 0.5);
            lp.frequency.setTargetAtTime(70 + 380 * p2 + 260 * v + 120 * state.energy, time, 0.1);
            lp2.frequency.setTargetAtTime(120 + 520 * p2 + 200 * v, time, 0.15);
        },
        duck(time, state) {
            const { params, prox } = state;
            const depth = clamp(params.duckDepth * 0.75 * (1 + 0.2 * prox), 0, 0.85);
            const release = params.duckRelease * (1 + 0.6 * prox);
            duckGain.gain.cancelScheduledValues(time);
            duckGain.gain.setTargetAtTime(1 - depth, time, 0.004);
            duckGain.gain.setTargetAtTime(1, time + 0.035, release / 3);
            const sweep = (60 / params.bpm) * (0.35 - 0.1 * prox);
            sidechainHp.frequency.cancelScheduledValues(time);
            sidechainHp.frequency.setTargetAtTime(90 + 130 * prox, time, 0.002);
            sidechainHp.frequency.setTargetAtTime(15, time + 0.035, sweep / 3);
        },
        dispose() {
            for (const node of nodes) node.dispose();
        },
    };
}
