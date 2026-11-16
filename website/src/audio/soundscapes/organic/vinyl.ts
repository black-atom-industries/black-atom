import { loopNoise, stopSource, type Layer, type LayerContext } from "./layer.ts";

/** Long enough that the crackle pattern never reads as a loop. */
const crackleSeconds = 11.3;
const cracklesPerSecond = 7;

/** A record's surface: a soft hiss bed and sparse crackle, filtered, with its own gain. */
export function createVinyl(ctx: LayerContext): Layer {
    const { tone, context, random } = ctx;
    const raw = context.rawContext;

    const hiss = loopNoise(ctx, { seconds: 3, gain: 1 });
    const hissHp = new tone.Filter({ type: "highpass", frequency: 1800, Q: 0.5 });
    const hissLp = new tone.Filter({ type: "lowpass", frequency: 7000, Q: 0.5 });
    const hissGain = new tone.Gain(0.05);
    tone.connect(hiss, hissHp);
    hissHp.chain(hissLp, hissGain);

    const buffer = raw.createBuffer(1, Math.round(raw.sampleRate * crackleSeconds), raw.sampleRate);
    const data = buffer.getChannelData(0);
    const count = Math.round(crackleSeconds * cracklesPerSecond);
    for (let i = 0; i < count; i++) {
        const start = Math.floor(random() * data.length);
        const isPop = random() < 0.08;
        const amp = (isPop ? 0.9 : 0.15 + 0.5 * random() ** 3) * (random() < 0.5 ? -1 : 1);
        const length = Math.round(raw.sampleRate * (isPop ? 0.004 : 0.0012) * (0.5 + random()));
        for (let j = 0; j < length && start + j < data.length; j++) {
            data[start + j] =
                (data[start + j] ?? 0) + amp * (1 - j / length) ** 2 * (random() * 0.6 + 0.4);
        }
    }
    const crackle = raw.createBufferSource();
    crackle.buffer = buffer;
    crackle.loop = true;
    crackle.start(context.currentTime);
    const crackleHp = new tone.Filter({ type: "highpass", frequency: 700, Q: 0.6 });
    const crackleLp = new tone.Filter({ type: "lowpass", frequency: 9000, Q: 0.5 });
    const crackleGain = new tone.Gain(0.7);
    tone.connect(crackle, crackleHp);
    crackleHp.chain(crackleLp, crackleGain);

    const level = new tone.Gain(0);
    hissGain.connect(level);
    crackleGain.connect(level);
    level.connect(ctx.out);

    return {
        update(state, time) {
            level.gain.setTargetAtTime(state.params.vinyl, time, 0.2);
        },
        dispose() {
            stopSource(hiss);
            stopSource(crackle);
            for (const node of [
                hissHp,
                hissLp,
                hissGain,
                crackleHp,
                crackleLp,
                crackleGain,
                level,
            ]) {
                node.dispose();
            }
        },
    };
}
