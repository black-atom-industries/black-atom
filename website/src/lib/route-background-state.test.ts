import { describe, expect, it } from "vitest";
import { backgroundStateFor } from "./route-background-state.ts";

describe("backgroundStateFor", () => {
    it.each([
        ["/", "full"],
        ["/black-atom", "full"],
        ["/black-atom/livery", "full"],
        ["/iter", "iter"],
        ["/radar", "radar"],
    ])("%s shows %s", (pathname, state) => {
        expect(backgroundStateFor(pathname)).toBe(state);
    });

    it.each(["/black-atom/themes/jpn-koyo-dark", "/changelog", "/about", "/impressum", "/privacy"])(
        "%s shows the receded black hole",
        (pathname) => {
            expect(backgroundStateFor(pathname)).toBe("receded");
        },
    );

    it("ignores a trailing slash", () => {
        expect(backgroundStateFor("/black-atom/")).toBe("full");
        expect(backgroundStateFor("/iter/")).toBe("iter");
    });

    it("recedes on unknown paths, so a 404 page stays quiet", () => {
        expect(backgroundStateFor("/nope")).toBe("receded");
        expect(backgroundStateFor("/iter/nope")).toBe("receded");
    });
});
