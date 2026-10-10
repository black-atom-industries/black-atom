import { assert, test } from "vitest";
import { getNextRadioGroupIndex } from "./radio-group-navigation.ts";

test("ArrowRight moves to the next index", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 0, 3), 1);
});

test("ArrowDown moves to the next index (same as ArrowRight)", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowDown", 0, 3), 1);
});

test("ArrowLeft moves to the previous index", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowLeft", 1, 3), 0);
});

test("ArrowUp moves to the previous index (same as ArrowLeft)", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowUp", 1, 3), 0);
});

test("ArrowRight wraps from the last index to the first", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 2, 3), 0);
});

test("ArrowLeft wraps from the first index to the last", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowLeft", 0, 3), 2);
});

test("Home jumps to the first index", () => {
    assert.deepEqual(getNextRadioGroupIndex("Home", 2, 4), 0);
});

test("End jumps to the last index", () => {
    assert.deepEqual(getNextRadioGroupIndex("End", 0, 4), 3);
});

test("an unrecognized key returns null", () => {
    assert.deepEqual(getNextRadioGroupIndex("Tab", 0, 3), null);
});

test("zero options returns null for any key", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 0, 0), null);
    assert.deepEqual(getNextRadioGroupIndex("Home", 0, 0), null);
});

test("ArrowRight skips a disabled index", () => {
    // options: [0 enabled, 1 disabled, 2 enabled] — moving right from 0 lands on 2
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([1])), 2);
});

test("ArrowLeft skips a disabled index", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowLeft", 2, 3, new Set([1])), 0);
});

test("ArrowRight wraps around disabled indexes at the boundary", () => {
    // options: [0 enabled, 1 enabled, 2 disabled] — moving right from 1 wraps past 2 to 0
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 1, 3, new Set([2])), 0);
});

test("Home skips leading disabled indexes", () => {
    assert.deepEqual(getNextRadioGroupIndex("Home", 2, 4, new Set([0, 1])), 2);
});

test("End skips trailing disabled indexes", () => {
    assert.deepEqual(getNextRadioGroupIndex("End", 0, 4, new Set([2, 3])), 1);
});

test("all options disabled returns null", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([0, 1, 2])), null);
    assert.deepEqual(getNextRadioGroupIndex("Home", 0, 3, new Set([0, 1, 2])), null);
});

test("a single enabled option returns itself on arrow keys (no other target)", () => {
    assert.deepEqual(getNextRadioGroupIndex("ArrowRight", 0, 3, new Set([1, 2])), 0);
    assert.deepEqual(getNextRadioGroupIndex("ArrowLeft", 0, 3, new Set([1, 2])), 0);
});
