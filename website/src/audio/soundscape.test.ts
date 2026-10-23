import { describe, expect, test } from "vitest";
import { organicParams } from "./soundscapes/organic/params.ts";
import { themeRoot } from "./soundscape.ts";

describe("organic params", () => {
    test("parse their own defaults: the shipped sound, without a heartbeat", () => {
        const defaults = organicParams.parse({});
        expect(organicParams.parse(defaults)).toEqual(defaults);
        expect(defaults).toMatchObject({
            soundVolume: 0.15,
            atomLowpass: 128,
            linesVolume: 0,
            globalLowpassNear: 2390,
            heartbeat: false,
            bpm: 96,
        });
    });

    test("reject values outside their range", () => {
        expect(organicParams.safeParse({ bpm: 200 }).success).toBe(false);
        expect(organicParams.safeParse({ vinyl: -1 }).success).toBe(false);
    });
});

describe("themeRoot", () => {
    test("keeps light themes above dark ones", () => {
        const dark = themeRoot("black-atom-jpn-koyo-dark", "dark");
        const light = themeRoot("black-atom-jpn-koyo-light", "light");
        expect(dark.ratio).toBeLessThanOrEqual(1);
        expect(light.ratio).toBeGreaterThan(1);
        expect(light.isLight).toBe(true);
    });

    test("never repeats the previous root on a theme change", () => {
        const first = themeRoot("black-atom-default-dark", "dark");
        expect(themeRoot("black-atom-default-dark", "dark", first).ratio).not.toBe(first.ratio);
    });
});
