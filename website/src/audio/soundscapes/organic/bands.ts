import { loopNoise, stopSource, type Layer, type LayerContext } from "./layer.ts";

const chordSemitones = [0, 7, 12, 16, 19, 24];
const base = 130.8;

/**
 * The accretion disk: noise ringing in narrow bands tuned to the theme chord, orbiting the
 * stereo field with a three-lobed swell, plus a faint orbital sizzle.
 */
export function createBands(ctx: LayerContext): Layer {
    const { tone } = ctx;
    const nodes: { dispose(): unknown }[] = [];
    function keep<Node extends { dispose(): unknown }>(node: Node): Node {
        nodes.push(node);
        return node;
    }

    const noise = loopNoise(ctx, { seconds: 4, gain: 0.5, playbackRate: 0.97 });
    const swell = keep(new tone.Gain(0.65));
    const pan = keep(new tone.Panner(0));
    const bus = keep(new tone.Gain(0));
    swell.chain(pan, bus, ctx.out);
    bus.chain(keep(new tone.Gain(0.6)), ctx.send);

    const orbit = keep(new tone.Oscillator(0.143, "sine"));
    orbit.chain(keep(new tone.Gain(0.7)), pan.pan);
    orbit.start();
    const lobe = keep(new tone.Oscillator(0.43, "sine"));
    const lobeDepth = keep(new tone.Gain(0.35));
    lobe.chain(lobeDepth, swell.gain);
    lobe.start();

    const bands = chordSemitones.map((semitones, k) => {
        const first = keep(new tone.Filter({ type: "bandpass", frequency: base, Q: 60 }));
        const second = keep(new tone.Filter({ type: "bandpass", frequency: base, Q: 60 }));
        const drift = keep(new tone.Oscillator(0.05 + k * 0.023, "sine"));
        const driftDepth = keep(new tone.Gain(4));
        drift.connect(driftDepth);
        driftDepth.connect(first.detune);
        driftDepth.connect(second.detune);
        drift.start();
        tone.connect(noise, first);
        first.chain(second, keep(new tone.Gain(9 / (1 + k * 0.35))), swell);
        return { semitones, filters: [first, second] };
    });

    const sizzle = keep(new tone.Filter({ type: "bandpass", frequency: 5200, Q: 1.4 }));
    const sizzleGain = keep(new tone.Gain(0.05));
    tone.connect(noise, sizzle);
    sizzle.chain(sizzleGain, swell);

    let ratio = 0;

    return {
        update(state, time) {
            const { params, prox, root } = state;
            const p2 = prox * prox;
            if (root.ratio !== ratio) {
                const timeConstant = ratio === 0 ? 0.01 : 0.9;
                ratio = root.ratio;
                for (const band of bands) {
                    const frequency =
                        base * ratio * (root.isLight ? 2 : 1) * 2 ** (band.semitones / 12);
                    for (const filter of band.filters) {
                        filter.frequency.setTargetAtTime(frequency, time, timeConstant);
                    }
                }
            }
            bus.gain.setTargetAtTime(
                params.diskVolume *
                    (0.05 + 0.22 * prox + 0.12 * p2) *
                    (0.6 + 0.4 * Math.min(2, params.diskLineGlow)) *
                    (1 + 0.5 * state.energy),
                time,
                0.3,
            );
            orbit.frequency.setTargetAtTime(
                (0.143 + 0.25 * params.diskPull) * (1 - 0.6 * p2),
                time,
                0.6,
            );
            lobe.frequency.setTargetAtTime(0.43 * (1 - 0.6 * p2), time, 0.6);
            lobeDepth.gain.setTargetAtTime(0.35 * params.ringSwell, time, 0.2);
            sizzle.frequency.setTargetAtTime(params.ringNoiseHz, time, 0.2);
            sizzleGain.gain.setTargetAtTime(
                params.ringNoise * (0.03 + 0.08 * params.diskPull + 0.1 * state.motion),
                time,
                0.2,
            );
        },
        dispose() {
            stopSource(noise);
            for (const node of nodes) node.dispose();
        },
    };
}
