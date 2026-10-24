import type { SceneEvent } from "#/background/types.ts";
import type { Layer, LayerContext, OrganicState } from "./layer.ts";

const chord = [0, 4, 7, 12, 16, 19, 24];
const vowels = [
    [730, 1090],
    [570, 840],
    [440, 1020],
    [300, 870],
    [660, 1720],
    [400, 2000],
    [520, 1190],
] as const;
const partials = [
    { ratio: 1, level: 1, decay: 1 },
    { ratio: 2.71, level: 0.45, decay: 0.62 },
    { ratio: 5.17, level: 0.22, decay: 0.38 },
    { ratio: 8.43, level: 0.1, decay: 0.22 },
] as const;

type Absorb = Extract<SceneEvent, { type: "absorb" }>;

export interface Voices extends Layer {
    /** One absorbed line: struck beads, and near the hole a sung voice that lights a line. */
    absorb(event: Absorb, state: OrganicState): void;
    /** A rising arpeggio on the new root when the theme changes. */
    chime(state: OrganicState): void;
}

/** Struck glass beads on absorbed lines, and formant voices that sing near the hole. */
export function createVoices(ctx: LayerContext): Voices {
    const { tone, context, random } = ctx;
    const raw = context.rawContext;

    const beads = new tone.Gain(0);
    const beadDry = new tone.Filter({ type: "highpass", frequency: 140, Q: 0.7 });
    const echo = new tone.PingPongDelay({ delayTime: 0.19, feedback: 0.42, wet: 1 });
    const echoSend = new tone.Gain(0.55);
    const beadRoom = new tone.Gain(0.25);
    beads.chain(beadDry, ctx.out);
    beads.chain(echoSend, echo, ctx.out);
    beads.chain(beadRoom, ctx.send);

    const sung = new tone.Gain(0);
    const sungDry = new tone.Gain(0.28);
    const sungDelay = new tone.FeedbackDelay({ delayTime: 0.61, feedback: 0.22, wet: 1 });
    const sungDelayTone = new tone.Filter({ type: "lowpass", frequency: 2400 });
    const sungHp = new tone.Filter({ type: "highpass", frequency: 160, Q: 0.7 });
    sung.chain(sungDry, sungHp, ctx.out);
    sung.connect(ctx.send);
    sung.chain(sungDelay, sungDelayTone, ctx.send);

    const reverbIn = new tone.Gain(1).connect(ctx.send);
    const tick = raw.createBuffer(1, Math.round(raw.sampleRate * 0.03), raw.sampleRate);
    const tickData = tick.getChannelData(0);
    for (let i = 0; i < tickData.length; i++) {
        tickData[i] = (random() * 2 - 1) * (1 - i / tickData.length) ** 6;
    }

    /** End times of sounding voices; offline rendering never fires `onended` while scheduling. */
    let endings: number[] = [];
    let lastBead = 0;
    let isAudible = false;

    function voiceCount(now: number) {
        endings = endings.filter((end) => end > now);
        return endings.length;
    }

    function strike(t: number, f0: number, { amp, pan, pr, wet, clickNoise }: StrikeOptions) {
        const p2 = pr * pr;
        const p3 = p2 * pr;
        const decay = 0.06 + 0.5 * pr + 3.4 * p3 + random() * (0.04 + 0.8 * p2);
        const out = raw.createGain();
        out.gain.value = amp;
        const toneFilter = raw.createBiquadFilter();
        toneFilter.type = "lowpass";
        toneFilter.frequency.value = 16000 - 12500 * p2;
        out.connect(toneFilter);
        const panner = raw.createStereoPanner();
        panner.pan.setValueAtTime(pan, t);
        panner.pan.linearRampToValueAtTime(-pan * pr, t + decay);
        toneFilter.connect(panner);
        tone.connect(panner, beads);
        if (wet > 0.05) {
            const wetSend = raw.createGain();
            wetSend.gain.value = 0.9 * wet;
            toneFilter.connect(wetSend);
            tone.connect(wetSend, reverbIn);
        }

        const click = raw.createBufferSource();
        click.buffer = tick;
        click.playbackRate.value = 0.8 + random() * 0.6 - 0.5 * pr;
        const clickFilter = raw.createBiquadFilter();
        clickFilter.type = "highpass";
        clickFilter.frequency.value = 4500 - 3000 * pr;
        const clickGain = raw.createGain();
        clickGain.gain.value = clickNoise * 0.5 * (1 - 0.7 * pr);
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(out);
        click.start(t);
        click.stop(t + 0.04);

        const detune = 4 + 45 * p3;
        const glide = -1200 * p3 * (0.4 + 0.6 * random());
        const end = t + decay * 5;
        const attack = 0.002 + 0.25 * p3;
        const oscillators = partials.flatMap((partial) =>
            [-1, 1].map((side) => {
                const oscillator = raw.createOscillator();
                const gain = raw.createGain();
                const timeConstant = decay * partial.decay * (0.8 + random() * 0.4);
                oscillator.frequency.value =
                    f0 * partial.ratio * (1 + (random() - 0.5) * 0.004 * (1 + 6 * pr));
                oscillator.detune.setValueAtTime(side * detune * partial.ratio * 0.5, t);
                oscillator.detune.linearRampToValueAtTime(
                    side * detune * partial.ratio * 0.5 + glide,
                    t + decay * 3,
                );
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(partial.level * 0.18, t + attack);
                gain.gain.setTargetAtTime(0, t + attack, timeConstant);
                oscillator.connect(gain);
                gain.connect(out);
                oscillator.start(t);
                oscillator.stop(end);
                return oscillator;
            }),
        );
        endings.push(end);
        oscillators[0]?.addEventListener("ended", () => panner.disconnect(), { once: true });
    }

    function voice(t: number, frequency: number, pr: number, pan: number) {
        const q = Math.max(0, (pr - 0.35) / 0.65);
        const q3 = q * q * q;
        const f = frequency / 2;
        const attack = 0.3 + 0.8 * q + 0.5 * random();
        const duration = 1.5 + 4.5 * q;
        const peak = 0.02 + 0.035 * q;
        const out = raw.createGain();
        out.gain.setValueAtTime(0, t);
        out.gain.linearRampToValueAtTime(peak, t + attack);
        out.gain.setTargetAtTime(0, t + attack + duration * 0.4, duration * 0.3);
        const mix = raw.createGain();
        const formants = vowels[Math.floor(random() * vowels.length)] ?? vowels[0];
        formants.forEach((formant, j) => {
            const band = raw.createBiquadFilter();
            band.type = "bandpass";
            band.frequency.value = formant * (1 - 0.25 * q);
            band.Q.value = 6 - j * 2;
            const gain = raw.createGain();
            gain.gain.value = j ? 0.5 : 1;
            mix.connect(band);
            band.connect(gain);
            gain.connect(out);
        });
        const vibrato = raw.createOscillator();
        const vibratoDepth = raw.createGain();
        vibrato.frequency.value = 4.5 - 2.5 * q;
        vibratoDepth.gain.value = 5 + 45 * q3;
        vibrato.connect(vibratoDepth);
        const spread = 8 + 40 * q3;
        const end = t + attack + duration * 1.7;
        const oscillators = (
            [
                ["sawtooth", -spread, 0.5],
                ["sawtooth", spread, 0.5],
                ["triangle", 0, 0.6],
            ] as const
        ).map(([type, cents, level]) => {
            const oscillator = raw.createOscillator();
            const gain = raw.createGain();
            oscillator.type = type;
            oscillator.frequency.value = f;
            oscillator.detune.setValueAtTime(cents, t);
            oscillator.detune.linearRampToValueAtTime(cents - 900 * q3, t + attack + duration);
            vibratoDepth.connect(oscillator.detune);
            gain.gain.value = level;
            oscillator.connect(gain);
            gain.connect(mix);
            oscillator.start(t);
            oscillator.stop(end);
            return oscillator;
        });
        const panner = raw.createStereoPanner();
        panner.pan.value = -pan;
        out.connect(panner);
        tone.connect(panner, sung);
        vibrato.start(t);
        vibrato.stop(end);
        endings.push(end);
        oscillators[0]?.addEventListener("ended", () => panner.disconnect(), { once: true });
        ctx.visual.sing({
            pitch: Math.round(12 * Math.log2(f / 440) + 69),
            delay: Math.max(0, t - context.currentTime),
            duration: Math.max(0.6, duration),
            amp: 1,
        });
    }

    return {
        update(state, time) {
            const level = state.params.linesVolume;
            isAudible = level > 0;
            beads.gain.setTargetAtTime(level, time, 0.3);
            sung.gain.setTargetAtTime(level, time, 0.3);
        },
        absorb(event, state) {
            if (!isAudible) return;
            const { prox, motion, root, params } = state;
            const t = context.now();
            const tooSoon = t - lastBead < 0.012 + 0.09 * motion;
            if (tooSoon || voiceCount(t) >= 28 - Math.round(16 * motion)) return;
            lastBead = t;
            const hue = ((event.hue % 1) + 1) % 1;
            const base = 1046 * root.ratio * (root.isLight ? 2 : 1) * 2 ** -Math.round(1.6 * prox);
            const f0 = base * 2 ** ((chord[Math.floor(hue * chord.length)] ?? 0) / 12);
            const force = event.strength;
            const pan = event.pan * 0.9;
            const count =
                prox > 0.7 || motion > 0.3
                    ? 1
                    : 1 + Math.floor(random() * (1.5 + 3 * force) * (1 - prox));
            const amp = ((0.08 + 0.08 * force) * (1 - 0.35 * prox)) / (1 + 1.5 * motion);
            let at = t + 0.002;
            for (let i = 0; i < count; i++) {
                const frequency =
                    i === 0 ? f0 : base * 2 ** ((chord[Math.floor(random() * 4)] ?? 0) / 12);
                strike(at, frequency, {
                    amp: amp * (i ? 0.4 + random() * 0.4 : 1),
                    // A stereo panner warns outside -1..1, and the jitter can push a hard-panned line past it.
                    pan: Math.min(1, Math.max(-1, pan + (random() - 0.5) * 0.3)),
                    pr: prox,
                    wet: 0,
                    clickNoise: params.lineClickNoise,
                });
                at += 0.012 + random() * 0.06;
            }
            const sungChance = Math.max(0, (prox - 0.35) / 0.65);
            if (sungChance > 0 && voiceCount(t) < 16 && random() < sungChance ** 1.5 * 0.7) {
                voice(t + 0.01, f0 * 2, prox, pan);
            }
        },
        chime(state) {
            if (!isAudible) return;
            const t = context.now();
            const { root } = state;
            [0, 4, 7, 12].forEach((semitones, k) => {
                strike(
                    t + 0.02 + k * 0.07,
                    523 * root.ratio * (root.isLight ? 2 : 1) * 2 ** (semitones / 12),
                    {
                        amp: 0.06,
                        pan: (k - 1.5) * 0.4,
                        pr: 0.62,
                        wet: 0.5,
                        clickNoise: state.params.lineClickNoise,
                    },
                );
            });
        },
        dispose() {
            for (const node of [
                beads,
                beadDry,
                echo,
                echoSend,
                beadRoom,
                sung,
                sungDry,
                sungHp,
                sungDelay,
                sungDelayTone,
                reverbIn,
            ]) {
                node.dispose();
            }
        },
    };
}

interface StrikeOptions {
    amp: number;
    pan: number;
    /** Proximity at the strike: near beads ring longer, darker and detuned. */
    pr: number;
    wet: number;
    clickNoise: number;
}
