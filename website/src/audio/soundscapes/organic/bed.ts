import { droneLevel } from "./drone.ts";
import { loopNoise, stopSource, type Layer, type LayerContext } from "./layer.ts";

/** Filtered noise under the drone: it follows the drone's level and filters and opens with proximity. */
export function createBed(ctx: LayerContext): Layer {
    const { tone } = ctx;
    const noise = loopNoise(ctx, { seconds: 4, gain: 0.5 });
    const noiseLp = new tone.Filter({ type: "lowpass", frequency: 220, Q: 0.7 });
    const noiseGain = new tone.Gain(0.2);
    const lp = new tone.Filter({ type: "lowpass", frequency: 110, Q: 0.7 });
    const cut = new tone.Filter({ type: "lowpass", frequency: 128, Q: 0.7, rolloff: -24 });
    const level = new tone.Gain(0);
    tone.connect(noise, noiseLp);
    noiseLp.chain(noiseGain, lp, cut, level, ctx.out);

    return {
        update(state, time) {
            const { params, prox } = state;
            const p2 = prox * prox;
            const v = state.volatility * (0.35 + 0.65 * prox);
            noiseLp.frequency.setTargetAtTime(140 + 500 * v + 200 * p2, time, 0.08);
            noiseGain.gain.setTargetAtTime(
                params.droneNoise * (0.05 + 0.3 * p2 + 0.2 * v),
                time,
                0.1,
            );
            lp.frequency.setTargetAtTime(120 + 520 * p2 + 200 * v, time, 0.15);
            cut.frequency.setTargetAtTime(params.atomLowpass, time, 0.1);
            const saturationGain = 0.8 * (0.8 + 1.6 * p2) * Math.max(0.05, params.soundDistortion);
            level.gain.setTargetAtTime(
                0.5 * saturationGain * droneLevel(state) * params.atomVolume,
                time,
                0.12,
            );
        },
        dispose() {
            stopSource(noise);
            for (const node of [noiseLp, noiseGain, lp, cut, level]) node.dispose();
        },
    };
}
