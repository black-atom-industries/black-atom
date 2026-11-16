import type * as ToneModule from "tone";
import type { z } from "zod";
import { Store } from "@tanstack/react-store";
import { background } from "#/background/handle.ts";
import type { SceneEvent, SceneEvents } from "#/background/types.ts";
import type { Soundscape, SoundscapeVisual, ThemeRoot, Tone } from "./soundscape.ts";

type SoundStatus = "off" | "starting" | "on" | "fading";

const fadeInSeconds = 1.5;
const fadeOutSeconds = 0.6;
const crossfadeSeconds = 2;
/** Headroom after the soft clipper, so the output can never reach 0 dBFS. */
const outputTrim = 0.89;

export interface MasterChain {
    /** User volume and fades. */
    master: ToneModule.Gain;
    /** Input of the shared reverb. */
    reverb: ToneModule.Gain;
    dispose(): void;
}

/**
 * volume → mix bus (EQ, two-band compression, glue) → limiter → soft clip → trim → destination,
 * with a shared reverb returning into the volume stage.
 */
export function buildMasterChain(tone: Tone, random: () => number): MasterChain {
    const raw = tone.getContext().rawContext;
    const nodes: { dispose(): unknown }[] = [];
    function keep<Node extends { dispose(): unknown }>(node: Node): Node {
        nodes.push(node);
        return node;
    }
    function compressor(
        threshold: number,
        knee: number,
        ratio: number,
        attack: number,
        release: number,
    ) {
        return keep(new tone.Compressor({ threshold, knee, ratio, attack, release }));
    }

    const master = keep(new tone.Gain(0));
    const eq = keep(new tone.Filter({ type: "peaking", frequency: 280, Q: 0.9, gain: -3.5 }));
    const box = keep(new tone.Filter({ type: "peaking", frequency: 560, Q: 1.3, gain: -1.5 }));
    master.chain(eq, box);
    // Two bands split at 120 Hz (Linkwitz-Riley), so the sub never pumps the mids and highs.
    const glue = compressor(-14, 8, 1.8, 0.03, 0.3);
    box.chain(
        keep(new tone.Filter({ type: "lowpass", frequency: 120, Q: 0.7071, rolloff: -24 })),
        compressor(-20, 6, 3, 0.03, 0.28),
        keep(new tone.Gain(1.15)),
        glue,
    );
    box.chain(
        keep(new tone.Filter({ type: "highpass", frequency: 120, Q: 0.7071, rolloff: -24 })),
        compressor(-24, 8, 2.5, 0.012, 0.18),
        keep(new tone.Gain(1.2)),
        glue,
    );
    const clip = keep(new tone.WaveShaper((x) => Math.tanh(x * 1.6) / Math.tanh(1.6), 4096));
    clip.oversample = "4x";
    glue.chain(compressor(-4, 0, 20, 0.001, 0.12), keep(new tone.Gain(0.8)), clip);
    clip.connect(keep(new tone.Gain(outputTrim)).toDestination());

    const seconds = 6.5;
    const length = Math.round(raw.sampleRate * seconds);
    const impulse = [0, 1].map(() =>
        Float32Array.from({ length }, (_, i) => (random() * 2 - 1) * (1 - i / length) ** 3),
    );
    const reverb = keep(new tone.Gain(1));
    reverb.chain(
        keep(new tone.Filter({ type: "highpass", frequency: 260, rolloff: -24 })),
        keep(new tone.Delay(0.045, 0.2)),
        keep(new tone.Convolver(tone.ToneAudioBuffer.fromArray(impulse))),
        keep(new tone.Filter({ type: "peaking", frequency: 450, Q: 0.8, gain: -3 })),
        master,
    );

    return {
        master,
        reverb,
        dispose() {
            for (const node of nodes) node.dispose();
        },
    };
}

export interface MountedSoundscape<Params extends z.AnyZodObject> {
    soundscape: Soundscape<Params>;
    /** Crossfade gains on the dry and the reverb path. */
    gains: ToneModule.Gain[];
    dispose(): void;
}

/** Builds a soundscape into the chain behind its own crossfade gains, starting at `level`. */
export function mountSoundscape<Params extends z.AnyZodObject>(
    tone: Tone,
    chain: MasterChain,
    soundscape: Soundscape<Params>,
    { visual, random, level }: { visual: SoundscapeVisual; random: () => number; level: number },
): MountedSoundscape<Params> {
    const context = tone.getContext();
    const bus = new tone.Gain(level).connect(chain.master);
    const send = new tone.Gain(level).connect(chain.reverb);
    soundscape.build({
        tone,
        context,
        transport: context.transport,
        bus,
        reverb: send,
        visual,
        random,
    });
    return {
        soundscape,
        gains: [bus, send],
        dispose() {
            soundscape.dispose();
            bus.dispose();
            send.dispose();
        },
    };
}

export interface SoundEngine<Params extends z.AnyZodObject> {
    readonly status: Store<SoundStatus>;
    /** Call from a user gesture: the audio context may only start there. Loads Tone on first use. */
    start(): Promise<void>;
    /** Fades to silence, then suspends the audio context. */
    stop(): void;
    /** 0 to 1. */
    setVolume(volume: number): void;
    setParams(partial: Partial<z.infer<Params>>): void;
    setTheme(root: ThemeRoot): void;
    /** Crossfades to another soundscape. */
    use(load: () => Promise<Soundscape<Params>>): Promise<void>;
    /** Feeds an event to the soundscape, as the scene would. */
    dispatch(event: SceneEvent): void;
    /** Whether scene events reach the soundscape. */
    listen(isListening: boolean): void;
    mute(layers: ReadonlySet<string>): void;
    /** Closes the audio context; a later `start()` begins from scratch. */
    dispose(): void;
}

interface Running {
    tone: Tone;
    raw: AudioContext;
    chain: MasterChain;
}

function createSoundEngine<Params extends z.AnyZodObject>({
    events,
    visual,
    load,
}: {
    events: SceneEvents;
    visual: SoundscapeVisual;
    load: () => Promise<Soundscape<Params>>;
}): SoundEngine<Params> {
    const status = new Store<SoundStatus>("off");
    let raw: AudioContext | undefined;
    let running: Running | undefined;
    let current: MountedSoundscape<Params> | undefined;
    let volume = 1;
    let params: Partial<z.infer<Params>> = {};
    let root: ThemeRoot | undefined;
    let muted: ReadonlySet<string> = new Set();
    let isListening = true;
    let unsubscribe: (() => void) | undefined;
    let suspendTimer: number | undefined;
    /** One boot per context, shared by every `start()` that arrives while Tone loads. */
    let booting: Promise<Running | undefined> | undefined;
    /** Only the latest `start()` finishes the fade in; earlier ones step aside. */
    let attempts = 0;
    /** The soundscape fading out after a crossfade, and the timer that disposes it. */
    let retiring: { slot: MountedSoundscape<Params>; timer: number } | undefined;

    function finishRetiring() {
        if (!retiring) return;
        window.clearTimeout(retiring.timer);
        retiring.slot.dispose();
        retiring = undefined;
    }

    /** Reads the status fresh; TypeScript would keep a narrowing across the awaits in `start`. */
    function isStarting() {
        return status.state === "starting";
    }

    function fadeTo(level: number, seconds: number) {
        if (!running) return;
        const gain = running.chain.master.gain;
        const now = running.tone.now();
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.getValueAtTime(now), now);
        gain.linearRampToValueAtTime(level, now + seconds);
    }

    function suspendAfterFade() {
        window.clearTimeout(suspendTimer);
        suspendTimer = window.setTimeout(
            () => {
                if (status.state !== "on") void raw?.suspend();
                if (status.state === "fading") status.setState(() => "off");
            },
            (fadeOutSeconds + 0.15) * 1000,
        );
    }

    function handleVisibility() {
        if (status.state !== "on" || !raw) return;
        if (document.hidden) {
            fadeTo(0, 0.2);
            window.clearTimeout(suspendTimer);
            suspendTimer = window.setTimeout(() => void raw?.suspend(), 300);
        } else {
            window.clearTimeout(suspendTimer);
            void raw.resume();
            fadeTo(volume, 0.4);
        }
    }

    function subscribe() {
        unsubscribe?.();
        unsubscribe = isListening
            ? events.on((event) => current?.soundscape.onScene(event))
            : undefined;
    }

    function configure(soundscape: Soundscape<Params>) {
        soundscape.setParams(params);
        if (root) soundscape.setTheme(root);
        soundscape.mute(muted);
    }

    /** Resolves to `undefined` when `dispose()` closed the context while Tone loaded. */
    async function boot(context: AudioContext): Promise<Running | undefined> {
        // Without this constant the server build bundles Tone; audio only ever starts in a browser.
        if (import.meta.env.SSR) throw new Error("Sound runs in the browser only");
        const tone = await import("tone");
        if (raw !== context) return undefined;
        tone.setContext(context, true);
        const chain = buildMasterChain(tone, Math.random);
        const soundscape = await load();
        if (raw !== context) {
            chain.dispose();
            return undefined;
        }
        configure(soundscape);
        current = mountSoundscape(tone, chain, soundscape, {
            visual,
            random: Math.random,
            level: 1,
        });
        tone.getContext().transport.start();
        document.addEventListener("visibilitychange", handleVisibility);
        return { tone, raw: context, chain };
    }

    return {
        status,
        async start() {
            if (status.state === "on" || status.state === "starting") return;
            window.clearTimeout(suspendTimer);
            raw ??= new AudioContext({ latencyHint: "playback" });
            const context = raw;
            const attempt = ++attempts;
            const resumed = context.resume();
            status.setState(() => "starting");
            let booted: Running | undefined;
            try {
                booting ??= boot(context);
                booted = await booting;
                await resumed;
            } catch (error) {
                if (raw !== context) return;
                booting = undefined;
                status.setState(() => "off");
                throw error;
            }
            if (raw !== context || !booted) return;
            running = booted;
            if (attempt !== attempts) return;
            if (!isStarting()) {
                // Stopped while Tone was loading: the gesture already resumed the context.
                void context.suspend();
                return;
            }
            subscribe();
            status.setState(() => "on");
            if (document.hidden) void context.suspend();
            else fadeTo(volume, fadeInSeconds);
        },
        stop() {
            if (status.state === "off" || status.state === "fading") return;
            if (!running) {
                status.setState(() => "off");
                return;
            }
            status.setState(() => "fading");
            unsubscribe?.();
            unsubscribe = undefined;
            fadeTo(0, fadeOutSeconds);
            suspendAfterFade();
        },
        setVolume(next) {
            volume = next;
            if (status.state === "on" && !document.hidden) fadeTo(volume, 0.1);
        },
        setParams(partial) {
            params = { ...params, ...partial };
            current?.soundscape.setParams(partial);
        },
        setTheme(next) {
            root = next;
            current?.soundscape.setTheme(next);
        },
        async use(loadNext) {
            if (!running) return;
            const { tone, chain } = running;
            const soundscape = await loadNext();
            configure(soundscape);
            const previous = current;
            const next = mountSoundscape(tone, chain, soundscape, {
                visual,
                random: Math.random,
                level: 0,
            });
            current = next;
            const now = tone.now();
            for (const gain of next.gains) {
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(1, now + crossfadeSeconds);
            }
            finishRetiring();
            if (previous) {
                for (const gain of previous.gains) {
                    gain.gain.setValueAtTime(gain.gain.getValueAtTime(now), now);
                    gain.gain.linearRampToValueAtTime(0, now + crossfadeSeconds);
                }
                retiring = {
                    slot: previous,
                    timer: window.setTimeout(finishRetiring, (crossfadeSeconds + 0.2) * 1000),
                };
            }
            subscribe();
        },
        dispatch(event) {
            current?.soundscape.onScene(event);
        },
        listen(next) {
            isListening = next;
            if (status.state === "on") subscribe();
        },
        mute(layers) {
            muted = layers;
            current?.soundscape.mute(layers);
        },
        dispose() {
            window.clearTimeout(suspendTimer);
            unsubscribe?.();
            unsubscribe = undefined;
            document.removeEventListener("visibilitychange", handleVisibility);
            running?.tone.getContext().transport.stop();
            finishRetiring();
            current?.dispose();
            running?.chain.dispose();
            void raw?.close();
            current = undefined;
            running = undefined;
            booting = undefined;
            raw = undefined;
            status.setState(() => "off");
        },
    };
}

/** The site's one sound engine: organic, listening to the background scene and singing back to it. */
export const soundEngine = createSoundEngine({
    events: background.events,
    visual: background,
    load: () =>
        import.meta.env.SSR
            ? Promise.reject(new Error("Sound runs in the browser only"))
            : import("./soundscapes/organic/organic.ts").then((m) => m.createOrganic()),
});
