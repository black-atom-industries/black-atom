import { describe, expect, it } from "vite-plus/test";
import { contrastGrade } from "./contrast-grade.ts";

describe("contrastGrade", () => {
    it.each([
        [21, "aaa"],
        [7, "aaa"],
        [6.99, "aa"],
        [4.5, "aa"],
        [4.49, "large"],
        [3, "large"],
        [2.99, "low"],
        [1, "low"],
    ] as const)("grades %s as %s", (ratio, grade) => {
        expect(contrastGrade(ratio)).toBe(grade);
    });
});
