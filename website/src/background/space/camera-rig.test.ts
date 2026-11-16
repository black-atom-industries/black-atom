import { describe, expect, it } from "vitest";
import { Vector3 } from "three/webgpu";
import {
    clampZoom,
    flightOffset,
    flyFrame,
    logLerp,
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

describe("flyFrame", () => {
    const from = { x: 100, y: 200, r: 50 };
    const to = { x: 300, y: 100, r: 200 };

    it("starts at the old framing and lands on the new one", () => {
        expect(flyFrame(from, to, 0, { x: 0, y: 0, r: 0 })).toEqual(from);
        const end = flyFrame(from, to, 1, { x: 0, y: 0, r: 0 });
        expect(end.x).toBeCloseTo(300);
        expect(end.y).toBeCloseTo(100);
        expect(end.r).toBeCloseTo(200);
    });

    it("moves the centre evenly and the size in log space", () => {
        const mid = flyFrame(from, to, 0.5, { x: 0, y: 0, r: 0 });
        expect(mid.x).toBeCloseTo(200);
        expect(mid.r).toBeCloseTo(100);
        expect(logLerp(50, 200, 0.5)).toBeCloseTo(100);
    });
});
