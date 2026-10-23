import { useId } from "react";
import { Caption } from "#/components/caption/index.ts";
import { PairToggle } from "#/components/pair-toggle/index.ts";
import { RangeField } from "#/components/range-field/index.ts";
import { Stack } from "#/components/stack/index.ts";

export type SoundSettings = {
    isOn: boolean;
    volume: number;
    isHeartbeatOn: boolean;
    bpm: number;
    vinyl: number;
};

type Props = {
    settings: SoundSettings;
    onChange: (patch: Partial<SoundSettings>) => void;
};

export function SoundPanel({ settings, onChange }: Props) {
    const soundscapeId = useId();
    const soundscapeToggleId = useId();
    const heartbeatId = useId();
    const heartbeatToggleId = useId();

    return (
        <Stack gap="lg" data-partial="SoundPanel">
            <Stack direction="row" justify="between" align="center">
                <Caption id={soundscapeId} tone="subtle" size="sm">
                    Soundscape
                </Caption>
                <PairToggle
                    first="on"
                    second="off"
                    active={settings.isOn ? "first" : "second"}
                    aria-pressed={settings.isOn}
                    id={soundscapeToggleId}
                    aria-labelledby={`${soundscapeId} ${soundscapeToggleId}`}
                    onClick={() => onChange({ isOn: !settings.isOn })}
                />
            </Stack>
            <RangeField
                label="Volume"
                valueText={String(settings.volume)}
                value={settings.volume}
                min={0}
                max={100}
                onValueChange={(volume) => onChange({ volume })}
            />
            <Stack gap="md" isDivided>
                <Stack direction="row" justify="between" align="center">
                    <Caption id={heartbeatId} tone="subtle" size="sm">
                        Heartbeat
                    </Caption>
                    <PairToggle
                        first="on"
                        second="off"
                        active={settings.isHeartbeatOn ? "first" : "second"}
                        aria-pressed={settings.isHeartbeatOn}
                        id={heartbeatToggleId}
                        aria-labelledby={`${heartbeatId} ${heartbeatToggleId}`}
                        onClick={() => onChange({ isHeartbeatOn: !settings.isHeartbeatOn })}
                    />
                </Stack>
                <RangeField
                    label="Tempo"
                    valueText={`${settings.bpm} BPM`}
                    value={settings.bpm}
                    min={80}
                    max={140}
                    onValueChange={(bpm) => onChange({ bpm })}
                />
                <RangeField
                    label="Vinyl"
                    valueText={String(settings.vinyl)}
                    value={settings.vinyl}
                    min={0}
                    max={100}
                    onValueChange={(vinyl) => onChange({ vinyl })}
                />
            </Stack>
        </Stack>
    );
}
