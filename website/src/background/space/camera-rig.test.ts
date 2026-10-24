import { describe, expect, it } from "vitest";
import { Vector3 } from "three/webgpu";
import { flightOffset, shouldFrame, type CutWait } from "./camera-rig.ts";

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
