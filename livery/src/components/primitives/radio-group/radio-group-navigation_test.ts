import { assertEquals } from "@std/assert";
import { getNextRadioGroupIndex } from "./radio-group-navigation.ts";

Deno.test("ArrowRight moves to the next index", () => {
    assertEquals(getNextRadioGroupIndex("ArrowRight", 0, 3), 1);
});

Deno.test("ArrowDown moves to the next index (same as ArrowRight)", () => {
    assertEquals(getNextRadioGroupIndex("ArrowDown", 0, 3), 1);
});

Deno.test("ArrowLeft moves to the previous index", () => {
    assertEquals(getNextRadioGroupIndex("ArrowLeft", 1, 3), 0);
});

Deno.test("ArrowUp moves to the previous index (same as ArrowLeft)", () => {
    assertEquals(getNextRadioGroupIndex("ArrowUp", 1, 3), 0);
});

Deno.test("ArrowRight wraps from the last index to the first", () => {
    assertEquals(getNextRadioGroupIndex("ArrowRight", 2, 3), 0);
});

Deno.test("ArrowLeft wraps from the first index to the last", () => {
    assertEquals(getNextRadioGroupIndex("ArrowLeft", 0, 3), 2);
});

Deno.test("Home jumps to the first index", () => {
    assertEquals(getNextRadioGroupIndex("Home", 2, 4), 0);
});

Deno.test("End jumps to the last index", () => {
    assertEquals(getNextRadioGroupIndex("End", 0, 4), 3);
});

Deno.test("an unrecognized key returns null", () => {
    assertEquals(getNextRadioGroupIndex("Tab", 0, 3), null);
});

Deno.test("zero options returns null for any key", () => {
    assertEquals(getNextRadioGroupIndex("ArrowRight", 0, 0), null);
    assertEquals(getNextRadioGroupIndex("Home", 0, 0), null);
});

Deno.test("ArrowRight skips a disabled index", () => {
    // options: [0 enabled, 1 disabled, 2 enabled] — moving right from 0 lands on 2
    assertEquals(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([1])), 2);
});

Deno.test("ArrowLeft skips a disabled index", () => {
    assertEquals(getNextRadioGroupIndex("ArrowLeft", 2, 3, new Set([1])), 0);
});

Deno.test("ArrowRight wraps around disabled indexes at the boundary", () => {
    // options: [0 enabled, 1 enabled, 2 disabled] — moving right from 1 wraps past 2 to 0
    assertEquals(getNextRadioGroupIndex("ArrowRight", 1, 3, new Set([2])), 0);
});

Deno.test("Home skips leading disabled indexes", () => {
    assertEquals(getNextRadioGroupIndex("Home", 2, 4, new Set([0, 1])), 2);
});

Deno.test("End skips trailing disabled indexes", () => {
    assertEquals(getNextRadioGroupIndex("End", 0, 4, new Set([2, 3])), 1);
});

Deno.test("all options disabled returns null", () => {
    assertEquals(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([0, 1, 2])), null);
    assertEquals(getNextRadioGroupIndex("Home", 0, 3, new Set([0, 1, 2])), null);
});

Deno.test("a single enabled option returns itself on arrow keys (no other target)", () => {
    assertEquals(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([1, 2])), 0);
    assertEquals(getNextRadioGroupIndex("ArrowLeft", 0, 3, new Set([1, 2])), 0);
});
