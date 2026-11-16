import { loopNoise, stopSource, type Layer, type LayerContext } from "./layer.ts";

/**
 * Air moving past the camera: band-passed noise whose level and cutoff follow the camera speed,
 * drifting toward the side the view travels to. Its ceiling sits under the drone.
 */
export function createMotion(ctx: LayerContext): Layer {
    const { tone } = ctx;
    const noise = loopNoise(ctx, { seconds: 3, gain: 1 });
    const body = new tone.Filter({
        type: "lowpass",
        frequency: 800,
        Q: 0.5,
        rolloff: -24,
    });
    const band = new tone.Filter({ type: "bandpass", frequency: 260, Q: 0.9 });
    const pan = new tone.Panner(0);
    const level = new tone.Gain(0);
    tone.connect(noise, body);
    body.chain(band, pan, level, ctx.out);

    let previous = 0;

    return {
        update(state, time) {
            const amount = state.motion;
            const isRising = amount > previous;
            previous = amount;
            const timeConstant = isRising ? 0.25 : 0.7;
            band.frequency.setTargetAtTime(220 + 700 * amount ** 1.2, time, timeConstant);
            pan.pan.setTargetAtTime(0.45 * state.drift, time, 0.4);
            level.gain.setTargetAtTime(
                state.params.motionVolume * 0.18 * amount ** 0.8,
                time,
                timeConstant,
            );
        },
        dispose() {
            stopSource(noise);
            for (const node of [body, band, pan, level]) node.dispose();
        },
    };
}
