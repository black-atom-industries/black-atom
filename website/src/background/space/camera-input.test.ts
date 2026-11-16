import { describe, expect, it } from "vitest";
import { pinchStep, readWheel } from "./camera-input.ts";

describe("readWheel", () => {
    const wheel = { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, shiftKey: false };

    it("leaves vertical scrolling to the page", () => {
        expect(readWheel({ ...wheel, deltaY: 100 })).toBeUndefined();
    });

    it("zooms out on a Ctrl wheel down and in on a pinch open", () => {
        const out = readWheel({ ...wheel, ctrlKey: true, deltaY: 10 });
        const pinchIn = readWheel({ ...wheel, ctrlKey: true, deltaY: -10 });
        expect(out && "zoom" in out && out.zoom).toBeGreaterThan(1);
        expect(pinchIn && "zoom" in pinchIn && pinchIn.zoom).toBeLessThan(1);
    });

    it("takes a step per mouse notch, whether it counts pixels or lines", () => {
        const pixels = readWheel({ ...wheel, ctrlKey: true, deltaY: 500 });
        const lines = readWheel({ ...wheel, ctrlKey: true, deltaY: 3, deltaMode: 1 });
        for (const notch of [pixels, lines]) {
            const factor = notch && "zoom" in notch ? notch.zoom : 1;
            expect(factor).toBeGreaterThan(1.2);
            expect(factor).toBeLessThan(1.5);
        }
    });

    it("turns on a sideways swipe and on Shift with a vertical wheel", () => {
        const yaw = (input: Parameters<typeof readWheel>[0]) => {
            const read = readWheel(input);
            return read && "yaw" in read ? read.yaw : 0;
        };
        expect(yaw({ ...wheel, deltaX: 50 })).toBeCloseTo(7);
        expect(yaw({ ...wheel, shiftKey: true, deltaY: 50 })).toBeCloseTo(7);
        expect(yaw({ ...wheel, shiftKey: true, deltaX: -50 })).toBeCloseTo(-7);
    });
});

describe("pinchStep", () => {
    it("moves the camera in as the fingers spread and out as they close", () => {
        expect(pinchStep(100, 200)).toBe(0.5);
        expect(pinchStep(200, 100)).toBe(2);
    });

    it("ignores the small spread changes of a two-finger drag", () => {
        expect(pinchStep(200, 205)).toBeUndefined();
        expect(pinchStep(200, 195)).toBeUndefined();
    });
});
