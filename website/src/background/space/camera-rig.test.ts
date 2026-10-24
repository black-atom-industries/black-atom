import { describe, expect, it } from "vitest";
import { Vector3 } from "three/webgpu";
import {
    clampZoom,
    flightOffset,
    pinchStep,
    readWheel,
    shouldFrame,
    wideness,
    zoomRange,
    type CutWait,
} from "./camera-rig.ts";

const cut: CutWait = {
    isCutting: true,
    hasAnchor: false,
    hasOldAnchor: true,
    waited: 0,
    settled: 0,
};

describe("shouldFrame", () => {
    it("frames at once when the landmark stays", () => {
        expect(shouldFrame({ ...cut, isCutting: false })).toBe(true);
    });

    it("frames a cut as soon as the new page's anchor is there", () => {
        expect(shouldFrame({ ...cut, hasAnchor: true })).toBe(true);
    });

    it("holds a cut while the old page still shows", () => {
        expect(shouldFrame({ ...cut, waited: 30 })).toBe(false);
    });

    it("falls back two frames after the old page went without the new anchor", () => {
        expect(shouldFrame({ ...cut, hasOldAnchor: false, waited: 1, settled: 1 })).toBe(false);
        expect(shouldFrame({ ...cut, hasOldAnchor: false, waited: 2, settled: 2 })).toBe(true);
    });

    it("stops waiting for a route that never renders", () => {
        expect(shouldFrame({ ...cut, waited: 90 })).toBe(true);
    });
});

describe("flightOffset", () => {
    const start = new Vector3(0, 120, 0);
    const lift = new Vector3(0, 0, 300);

    it("starts where an interrupted flight left the camera", () => {
        expect(flightOffset(start, lift, 0, new Vector3()).toArray()).toEqual([0, 120, 0]);
    });

    it("lifts most halfway and lands without an offset", () => {
        const mid = flightOffset(start, lift, 0.5, new Vector3());
        expect(mid.y).toBeCloseTo(60);
        expect(mid.z).toBeCloseTo(300);
        expect(flightOffset(start, lift, 1, new Vector3()).length()).toBeCloseTo(0);
    });
});

describe("zoomRange", () => {
    it("zooms in to five target radii and out to the wide shot's distance", () => {
        // Framed at 80 px from a rest distance of 1600 px; the wide shot sits 8 times farther out.
        expect(zoomRange(80, 1600, 0.5, 4)).toEqual({ min: 0.25, max: 8 });
    });

    it("only zooms in on the wide shot itself", () => {
        expect(zoomRange(400, 1600, 4, 4).max).toBe(1);
    });

    it("never zooms out from a shot already wider than the wide shot", () => {
        expect(zoomRange(300, 1600, 6, 4).max).toBe(1);
    });

    it("zooms in to half the distance where the close-up is farther out, as on the wide shot", () => {
        expect(zoomRange(400, 1600, 4, 4).min).toBe(0.5);
    });
});

describe("clampZoom", () => {
    const range = { min: 0.25, max: 8 };

    it("stops at both ends", () => {
        expect(clampZoom(0.1, range)).toBe(0.25);
        expect(clampZoom(20, range)).toBe(8);
        expect(clampZoom(2, range)).toBe(2);
    });

    it("holds a reset zoom of 1 in every range", () => {
        expect(clampZoom(1, zoomRange(400, 1600, 4, 4))).toBe(1);
        expect(clampZoom(1, zoomRange(80, 1600, 0.5, 4))).toBe(1);
    });
});

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

describe("wideness", () => {
    const range = { min: 0.5, max: 4 };

    it("is 0 at rest and when zoomed in, so the shot looks as before", () => {
        expect(wideness(1, range)).toBe(0);
        expect(wideness(0.6, range)).toBe(0);
    });

    it("reaches the wide shot at the far end of the range, halfway in log distance", () => {
        expect(wideness(2, range)).toBeCloseTo(0.5);
        expect(wideness(4, range)).toBe(1);
    });

    it("is 0 on a shot that can't zoom out", () => {
        expect(wideness(1, { min: 0.5, max: 1 })).toBe(0);
    });
});
