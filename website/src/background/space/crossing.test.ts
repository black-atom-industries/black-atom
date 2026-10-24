import { describe, expect, it } from "vitest";
import { createThinning, hasPassed } from "./crossing.ts";

describe("hasPassed", () => {
    it("sees a point the phase moved over", () => {
        expect(hasPassed(0.2, 0.3, 0.25)).toBe(true);
        expect(hasPassed(0.2, 0.3, 0.35)).toBe(false);
    });

    it("sees the point's repeat in a later period", () => {
        expect(hasPassed(3.2, 3.3, 0.25)).toBe(true);
        expect(hasPassed(0.95, 1.05, 0.02)).toBe(true);
    });

    it("works in radians", () => {
        expect(hasPassed(6.2, 6.4, 0.05, Math.PI * 2)).toBe(true);
        expect(hasPassed(6.2, 6.25, 0.05, Math.PI * 2)).toBe(false);
    });

    it("never fires for a phase that stood still", () => {
        expect(hasPassed(0.25, 0.25, 0.25)).toBe(false);
    });
});

describe("createThinning", () => {
    it("passes every crossing at share 1", () => {
        const thin = createThinning();
        expect([1, 1, 1].map(thin)).toEqual([true, true, true]);
    });

    it("passes every third crossing at share 1/3", () => {
        const thin = createThinning();
        const passed = Array.from({ length: 9 }, () => thin(1 / 3));
        expect(passed.filter(Boolean)).toHaveLength(3);
        expect(passed).toEqual([false, false, true, false, false, true, false, false, true]);
    });
});
