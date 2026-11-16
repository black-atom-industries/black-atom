import { describe, expect, it } from "vitest";
import { backgroundStateFor, backgroundStateKey, productParam } from "./route-background-state.ts";

function keyFor(pathname: string, product?: string) {
    return backgroundStateKey(backgroundStateFor(pathname, product));
}

describe("backgroundStateFor", () => {
    it.each([
        ["/", "hole"],
        ["/black-atom", "hole"],
        ["/black-atom/livery", "hole"],
        ["/black-atom/themes/jpn-koyo-dark", "hole-receded"],
        ["/iter", "iter"],
        ["/radar", "radar"],
        ["/changelog", "wide"],
        ["/about", "wide"],
        ["/impressum", "wide-receded"],
        ["/privacy", "wide-receded"],
    ])("%s shows %s", (pathname, key) => {
        expect(keyFor(pathname)).toBe(key);
    });

    it.each([
        ["radar", "wide-radar"],
        ["iter", "wide-iter"],
        ["black-atom", "wide-hole"],
        ["livery", "wide-hole"],
    ])("the changelog filtered to %s drifts the wide shot to %s", (product, key) => {
        expect(keyFor("/changelog", product)).toBe(key);
    });

    it("ignores the product param outside the changelog and unknown products", () => {
        expect(keyFor("/about", "radar")).toBe("wide");
        expect(keyFor("/changelog", "emacs")).toBe("wide");
    });

    it("ignores a trailing slash", () => {
        expect(keyFor("/black-atom/")).toBe("hole");
        expect(keyFor("/iter/")).toBe("iter");
    });

    it("recedes the wide shot on unknown paths, so a 404 page stays quiet", () => {
        expect(keyFor("/nope")).toBe("wide-receded");
        expect(keyFor("/iter/nope")).toBe("wide-receded");
    });
});

describe("productParam", () => {
    it("reads a known product and drops anything else", () => {
        expect(productParam({ product: "radar" })).toBe("radar");
        expect(productParam({ product: "emacs" })).toBeUndefined();
        expect(productParam({})).toBeUndefined();
        expect(productParam(undefined)).toBeUndefined();
    });
});
