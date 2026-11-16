import { describe, expect, test } from "vitest";
import { parseSoundSettings, serializeSoundSettings, type SoundSettings } from "./sound.ts";

const defaults: SoundSettings = {
    isOn: false,
    volume: 100,
    isHeartbeatOn: false,
    bpm: 96,
    vinyl: 30,
};

describe("sound settings", () => {
    test("nothing stored gives the defaults: sound off", () => {
        expect(parseSoundSettings(null)).toEqual(defaults);
    });

    test("round-trips through storage", () => {
        const settings: SoundSettings = {
            isOn: true,
            volume: 40,
            isHeartbeatOn: true,
            bpm: 120,
            vinyl: 0,
        };
        expect(parseSoundSettings(serializeSoundSettings(settings))).toEqual(settings);
    });

    test("a bad field falls back alone", () => {
        const raw = JSON.stringify({ isOn: true, volume: 400, bpm: "fast", vinyl: 55 });
        expect(parseSoundSettings(raw)).toEqual({ ...defaults, isOn: true, vinyl: 55 });
    });

    test("unreadable storage gives the defaults", () => {
        expect(parseSoundSettings("{not json")).toEqual(defaults);
        expect(parseSoundSettings("[]")).toEqual(defaults);
    });
});
