import { Store } from "@tanstack/react-store";
import { z } from "zod";

const soundStorageKey = "ba-sound";

/** Each field falls back on its own, so one bad value never resets the rest. */
const soundSettingsSchema = z.object({
    isOn: z.boolean().catch(false),
    volume: z.number().int().min(0).max(100).catch(100),
    isHeartbeatOn: z.boolean().catch(false),
    bpm: z.number().int().min(80).max(140).catch(96),
    vinyl: z.number().int().min(0).max(100).catch(30),
});

export type SoundSettings = z.infer<typeof soundSettingsSchema>;

export function parseSoundSettings(raw: string | null): SoundSettings {
    let value: unknown = {};
    try {
        value = JSON.parse(raw ?? "{}");
    } catch {
        // Unreadable storage counts as nothing stored.
    }
    const parsed = soundSettingsSchema.safeParse(value);
    return parsed.success ? parsed.data : soundSettingsSchema.parse({});
}

export function serializeSoundSettings(settings: SoundSettings): string {
    return JSON.stringify(settings);
}

function readStoredSoundSettings(): SoundSettings {
    if (typeof window === "undefined") return parseSoundSettings(null);
    try {
        return parseSoundSettings(localStorage.getItem(soundStorageKey));
    } catch {
        return parseSoundSettings(null);
    }
}

export const soundStore = new Store<SoundSettings>(readStoredSoundSettings());

soundStore.subscribe((settings) => {
    try {
        localStorage.setItem(soundStorageKey, serializeSoundSettings(settings));
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the settings last for this visit.
    }
});
