import { describe, expect, it } from "vite-plus/test";
import { describeSource } from "./describe-source.ts";

const sources = {
    "ui.fg.positive": { ref: "feedback.success" },
    "feedback.success": { ref: "palette.green" },
    "ui.bg.negative": { from: ["primaries.l30", "feedback.negative"] },
};

describe("describeSource", () => {
    it("follows references down to the slot typed in the theme", () => {
        expect(describeSource(sources, "ui.fg.positive")).toEqual({
            label: "is",
            paths: ["feedback.success", "palette.green"],
        });
    });

    it("lists the slots a computed color comes from", () => {
        expect(describeSource(sources, "ui.bg.negative")).toEqual({
            label: "from",
            paths: ["primaries.l30", "feedback.negative"],
        });
    });

    it("has nothing for a color typed in the theme", () => {
        expect(describeSource(sources, "palette.green")).toBeUndefined();
    });
});
