import { useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { z } from "zod";
import { soundEngine } from "#/audio/engine.ts";
import { createOrganic, organicLayers as layers } from "#/audio/soundscapes/organic/organic.ts";
import { organicParams, type OrganicParams } from "#/audio/soundscapes/organic/params.ts";
import type { SceneEvent } from "#/background/types.ts";
import { Button } from "#/components/button/index.ts";
import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { RangeField } from "#/components/range-field/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { soundStore } from "#/stores/sound.ts";

type ParamKey = keyof OrganicParams;

interface NumberControl {
    key: ParamKey;
    min: number;
    max: number;
    step: number;
}

const paramKeys = Object.keys(organicParams.shape).filter(
    (key): key is ParamKey => key in organicParams.shape,
);

function numberControl(key: ParamKey): NumberControl | undefined {
    const field = organicParams.shape[key].removeDefault();
    if (!(field instanceof z.ZodNumber)) return undefined;
    const min = field.minValue ?? 0;
    const max = field.maxValue ?? 1;
    return { key, min, max, step: field.isInt ? 1 : (max - min) / 200 };
}

const numberControls = paramKeys.flatMap((key) => numberControl(key) ?? []);
const switchKeys = paramKeys.filter((key) => numberControl(key) === undefined);

function sweep(drift: number) {
    soundEngine.dispatch({ type: "camera", speed: 1.1, drift, phase: "start" });
    let elapsed = 0;
    const timer = window.setInterval(() => {
        elapsed += 0.1;
        const isDone = elapsed >= 1.6;
        const speed = isDone ? 0.07 : 1.1 * (1 - elapsed / 2);
        soundEngine.dispatch({ type: "camera", speed, drift, phase: isDone ? "settle" : "move" });
        if (isDone) window.clearInterval(timer);
    }, 100);
}

function absorb() {
    const event: SceneEvent = {
        type: "absorb",
        hue: Math.random(),
        pan: Math.random() * 2 - 1,
        strength: 0.4 + Math.random() * 0.6,
    };
    soundEngine.dispatch(event);
}

/** Tunes the organic soundscape: every layer alone or muted, every parameter, and fake scene events. */
export function SoundLab() {
    const status = useSelector(soundEngine.status);
    const [params, setParams] = useState<OrganicParams>(() => organicParams.parse({}));
    const [solo, setSolo] = useState<string>();
    const [muted, setMuted] = useState<ReadonlySet<string>>(new Set());
    const [isLive, setIsLive] = useState(true);

    function handleStart() {
        soundStore.setState((previous) => ({ ...previous, isOn: true }));
        void soundEngine.start().then(() => soundEngine.setParams(params));
    }

    function handleStop() {
        soundStore.setState((previous) => ({ ...previous, isOn: false }));
        soundEngine.stop();
    }

    function applyMix(nextSolo: string | undefined, nextMuted: ReadonlySet<string>) {
        setSolo(nextSolo);
        setMuted(nextMuted);
        const silent = nextSolo ? new Set(layers.filter((layer) => layer !== nextSolo)) : nextMuted;
        soundEngine.mute(silent);
    }

    function handleMute(layer: string) {
        const next = new Set(muted);
        if (next.has(layer)) next.delete(layer);
        else next.add(layer);
        applyMix(solo, next);
    }

    function handleParam(patch: Partial<OrganicParams>) {
        setParams((previous) => ({ ...previous, ...patch }));
        soundEngine.setParams(patch);
    }

    function handleLive(next: boolean) {
        setIsLive(next);
        soundEngine.listen(next);
    }

    function proximity(distance: number) {
        handleLive(false);
        soundEngine.dispatch({ type: "proximity", distance, energy: 0.4 });
    }

    return (
        <main>
            <Section variant="page">
                <SceneAnchor variant="far-hole" />
                <Stack gap="xl">
                    <Stack gap="sm">
                        <Caption tone="subtle">Development</Caption>
                        <Heading variant="display-sm">Sound lab</Heading>
                        <Text tone="subtle">
                            Organic, layer by layer. Engine: {status}. Scene events:{" "}
                            {isLive ? "live from the background" : "fake, from the buttons below"}.
                        </Text>
                    </Stack>
                    <Stack direction="row" gap="sm" isWrapped>
                        <Button variant="chip" onClick={handleStart} isActive={status === "on"}>
                            Start
                        </Button>
                        <Button variant="chip" onClick={handleStop}>
                            Stop
                        </Button>
                        <Button
                            variant="chip"
                            isActive={isLive}
                            onClick={() => handleLive(!isLive)}
                        >
                            Live scene events
                        </Button>
                        <Button
                            variant="chip"
                            onClick={() => void soundEngine.use(async () => createOrganic())}
                        >
                            Rebuild (crossfade)
                        </Button>
                    </Stack>

                    <Stack gap="md">
                        <Heading variant="title" render={<h2 />}>
                            Layers
                        </Heading>
                        {layers.map((layer) => (
                            <Stack key={layer} direction="row" gap="sm" align="center">
                                <Caption size="sm">{layer}</Caption>
                                <Button
                                    variant="chip"
                                    isActive={solo === layer}
                                    aria-pressed={solo === layer}
                                    onClick={() =>
                                        applyMix(solo === layer ? undefined : layer, muted)
                                    }
                                >
                                    Solo {layer}
                                </Button>
                                <Button
                                    variant="chip"
                                    isActive={muted.has(layer)}
                                    aria-pressed={muted.has(layer)}
                                    onClick={() => handleMute(layer)}
                                >
                                    Mute {layer}
                                </Button>
                            </Stack>
                        ))}
                    </Stack>

                    <Stack gap="md">
                        <Heading variant="title" render={<h2 />}>
                            Fake scene events
                        </Heading>
                        <Stack direction="row" gap="sm" isWrapped>
                            <Button variant="chip" onClick={absorb}>
                                Absorb a line
                            </Button>
                            <Button variant="chip" onClick={() => proximity(0.4)}>
                                Proximity near (0.4)
                            </Button>
                            <Button variant="chip" onClick={() => proximity(1)}>
                                Proximity full page (1.0)
                            </Button>
                            <Button variant="chip" onClick={() => proximity(1.6)}>
                                Proximity receded (1.6)
                            </Button>
                            <Button variant="chip" onClick={() => sweep(-1)}>
                                Camera sweep left
                            </Button>
                            <Button variant="chip" onClick={() => sweep(1)}>
                                Camera sweep right
                            </Button>
                        </Stack>
                    </Stack>

                    <Stack gap="md">
                        <Heading variant="title" render={<h2 />}>
                            Parameters
                        </Heading>
                        <Stack direction="row" gap="sm" isWrapped>
                            {switchKeys.map((key) => {
                                const value = params[key];
                                return (
                                    <Button
                                        key={key}
                                        variant="chip"
                                        isActive={value === true}
                                        aria-pressed={value === true}
                                        onClick={() => handleParam({ [key]: value !== true })}
                                    >
                                        {key}
                                    </Button>
                                );
                            })}
                        </Stack>
                        <PageGrid columns="three">
                            {numberControls.map((control) => {
                                const value = params[control.key];
                                const number = typeof value === "number" ? value : control.min;
                                return (
                                    <RangeField
                                        key={control.key}
                                        label={control.key}
                                        valueText={String(Math.round(number * 1000) / 1000)}
                                        value={number}
                                        min={control.min}
                                        max={control.max}
                                        step={control.step}
                                        onValueChange={(next) =>
                                            handleParam({ [control.key]: next })
                                        }
                                    />
                                );
                            })}
                        </PageGrid>
                    </Stack>
                </Stack>
            </Section>
        </main>
    );
}
