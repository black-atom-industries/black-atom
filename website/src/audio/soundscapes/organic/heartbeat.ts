import { saturation, smoothstep, type Layer, type LayerContext } from "./layer.ts";

/** Sixteenths per heartbeat cycle: a strong beat on the first, a softer one two sixteenths later. */
const cycle = 8;
const fadeIn = 10;

export interface Heartbeat extends Layer {
    readonly isBeating: boolean;
}

/**
 * A soft, dry kick pair on the Transport at the panel's tempo. Each kick ducks the drone and
 * swells the hole. It bypasses the soundscape's low cut so the body stays.
 */
export function createHeartbeat(
    ctx: LayerContext,
    { onKick }: { onKick: (time: number) => void },
): Heartbeat {
    const { tone, context, transport } = ctx;
    const raw = context.rawContext;

    const drive = new tone.WaveShaper(saturation, 2048);
    drive.oversample = "4x";
    const box = new tone.Filter({ type: "peaking", frequency: 420, Q: 1, gain: -6 });
    const lowCut = new tone.Filter({ type: "highpass", frequency: 36, Q: 0.9 });
    const punch = new tone.Filter({ type: "peaking", frequency: 100, Q: 1.4, gain: 2.5 });
    const mid = new tone.Filter({ type: "peaking", frequency: 230, Q: 1.1, gain: -4.5 });
    const presence = new tone.Filter({ type: "peaking", frequency: 3200, Q: 1, gain: 4.5 });
    const top = new tone.Filter({ type: "lowpass", frequency: 3500, Q: 0.5 });
    const trim = new tone.Gain(0.8);
    const compressor = new tone.Compressor({
        threshold: -24,
        knee: 3,
        ratio: 6,
        attack: 0.018,
        release: 0.055,
    });
    const makeup = new tone.Gain(1.9);
    const fade = new tone.Gain(0);
    const subCut = new tone.Filter({ type: "highpass", frequency: 20, Q: 0.6 });
    const level = new tone.Gain(1);
    drive.chain(box, lowCut, punch, mid, presence, top, trim, compressor, makeup, fade);
    fade.chain(subCut, level, ctx.out);

    let isBeating = false;
    let step = 0;
    let startedAt = 0;

    function kick(t: number, amp: number) {
        const oscillator = raw.createOscillator();
        const gain = raw.createGain();
        const body = 44;
        const decay = 0.12 * 1.06;
        oscillator.frequency.setValueAtTime(85, t);
        oscillator.frequency.exponentialRampToValueAtTime(body * 1.04, t + 0.09);
        oscillator.frequency.exponentialRampToValueAtTime(body, t + 0.27);
        oscillator.frequency.linearRampToValueAtTime(body * 0.97, t + 0.6);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(amp, t + 0.002);
        gain.gain.setValueAtTime(amp, t + 0.05);
        gain.gain.setTargetAtTime(0, t + 0.05, decay);
        oscillator.connect(gain);
        tone.connect(gain, drive);
        oscillator.start(t);
        oscillator.stop(t + 0.05 + decay * 6);
        oscillator.addEventListener("ended", () => gain.disconnect(), { once: true });
        onKick(t);
    }

    const repeat = transport.scheduleRepeat((time) => {
        if (!isBeating) return;
        const position = step % cycle;
        const ramp = smoothstep(0, 8, time - startedAt);
        if (position === 0) kick(time, 0.75 * ramp);
        else if (position === 2) kick(time, 0.42 * ramp);
        step++;
    }, "16n");

    function begin(time: number) {
        isBeating = true;
        step = 0;
        startedAt = time;
        fade.gain.cancelScheduledValues(time);
        fade.gain.setValueAtTime(fade.gain.getValueAtTime(time), time);
        fade.gain.linearRampToValueAtTime(1, time + fadeIn);
    }

    function end(time: number) {
        isBeating = false;
        fade.gain.cancelScheduledValues(time);
        fade.gain.setTargetAtTime(0, time, 0.4);
    }

    return {
        get isBeating() {
            return isBeating;
        },
        update(next, time) {
            if (next.params.heartbeat && !isBeating) begin(time);
            else if (!next.params.heartbeat && isBeating) end(time);
            if (transport.bpm.value !== next.params.bpm) transport.bpm.value = next.params.bpm;
            level.gain.setTargetAtTime(next.params.heartbeatVolume, time, 0.1);
        },
        dispose() {
            transport.clear(repeat);
            for (const node of [
                drive,
                box,
                lowCut,
                punch,
                mid,
                presence,
                top,
                trim,
                compressor,
                makeup,
                fade,
                subCut,
                level,
            ]) {
                node.dispose();
            }
        },
    };
}
