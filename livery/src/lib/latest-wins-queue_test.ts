import { assert, describe, test } from "vitest";
import { createLatestWinsQueue } from "./latest-wins-queue.ts";

function deferredTasks() {
    const started: string[] = [];
    const finishers = new Map<string, () => void>();
    const task = (name: string) => () =>
        new Promise<void>((resolve) => {
            started.push(name);
            finishers.set(name, resolve);
        });
    const finish = async (name: string) => {
        finishers.get(name)?.();
        await new Promise((resolve) => setTimeout(resolve));
    };
    return { started, task, finish };
}

describe("createLatestWinsQueue", () => {
    test("starts a task before submit returns, so a second one can't slip in", () => {
        const { started, task } = deferredTasks();
        const queue = createLatestWinsQueue(() => false);

        queue.submit(task("first"));
        queue.submit(task("second"));

        assert.deepEqual(started, ["first"]);
    });

    test("runs only the newest waiting task once the running one finishes", async () => {
        const { started, task, finish } = deferredTasks();
        const queue = createLatestWinsQueue(() => false);

        queue.submit(task("first"));
        queue.submit(task("second"));
        queue.submit(task("third"));
        await finish("first");

        assert.deepEqual(started, ["first", "third"]);
    });

    test("waits for outside work and starts on drain", () => {
        const { started, task } = deferredTasks();
        let busy = true;
        const queue = createLatestWinsQueue(() => busy);

        queue.submit(task("first"));
        queue.drain();
        assert.deepEqual(started, []);

        busy = false;
        queue.drain();
        assert.deepEqual(started, ["first"]);
    });

    test("a failing task doesn't stop the next one", async () => {
        const { started, task } = deferredTasks();
        const queue = createLatestWinsQueue(() => false);

        queue.submit(() => Promise.reject(new Error("expected in this test")));
        queue.submit(task("next"));
        await new Promise((resolve) => setTimeout(resolve));

        assert.deepEqual(started, ["next"]);
    });
});
