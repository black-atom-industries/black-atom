import { describe, expect, it } from "vitest";
import { shouldFrame, type CutWait } from "./camera-rig.ts";

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
